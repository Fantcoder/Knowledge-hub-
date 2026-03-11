package com.knowledgehub.ai.service;

import com.knowledgehub.ai.dto.ChatRequest;
import com.knowledgehub.ai.dto.ChatResponse;
import com.knowledgehub.ai.dto.SemanticSearchResult;
import com.knowledgehub.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiChatService {

        private final WebClient aiWebClient;
        private final SemanticSearchService semanticSearchService;
        private final ObjectMapper objectMapper;

        @Value("${ai.chat-model:meta-llama/llama-3.2-3b-instruct:free}")
        private String chatModel;

        private static final int MAX_RETRIES = 4;
        private static final long INITIAL_BACKOFF_MS = 3000; // 3 seconds

        private static final String SYSTEM_PROMPT = """
                        You are KnowledgeHub AI — a helpful, intelligent assistant that answers questions
                        based ONLY on the user's personal notes provided below.

                        Rules:
                        1. Answer ONLY using information from the user's notes.
                        2. If the answer isn't in the notes, clearly say "I couldn't find information about this in your notes."
                        3. Always cite which note(s) your answer comes from using the note title.
                        4. Be concise but thorough.
                        5. If asked to summarize, synthesize information across relevant notes.
                        6. Use markdown formatting for better readability.

                        USER'S RELEVANT NOTES:
                        """;

        public ChatResponse chat(User user, ChatRequest request) {
                log.info("AI chat for user {}: '{}'", user.getUsername(), request.getQuestion());

                List<SemanticSearchResult> relevantNotes = semanticSearchService.search(
                                user, request.getQuestion(), 5);

                if (relevantNotes.isEmpty()) {
                        return ChatResponse.builder()
                                        .answer("I don't have enough context from your notes to answer this question. "
                                                        + "Try saving some notes first, and I'll be able to help you find and connect ideas!")
                                        .sourceNotes(List.of())
                                        .model(chatModel)
                                        .build();
                }

                String context = relevantNotes.stream()
                                .map(n -> String.format("--- Note: \"%s\" (relevance: %.0f%%) ---\n%s",
                                                n.getTitle(),
                                                n.getSimilarity() * 100,
                                                n.getContentPreview()))
                                .collect(Collectors.joining("\n\n"));

                String fullSystemPrompt = SYSTEM_PROMPT + "\n" + context;

                String answer = callChatApiWithRetry(fullSystemPrompt, request.getQuestion());

                List<ChatResponse.SourceNote> sources = relevantNotes.stream()
                                .map(n -> ChatResponse.SourceNote.builder()
                                                .noteId(n.getNoteId())
                                                .title(n.getTitle())
                                                .similarity(n.getSimilarity())
                                                .build())
                                .collect(Collectors.toList());

                return ChatResponse.builder()
                                .answer(answer)
                                .sourceNotes(sources)
                                .model(chatModel)
                                .build();
        }

        public Flux<String> chatStream(User user, ChatRequest request) {
                log.info("AI chat stream for user {}: '{}'", user.getUsername(), request.getQuestion());

                List<SemanticSearchResult> relevantNotes = semanticSearchService.search(
                                user, request.getQuestion(), 5);

                List<Map<String, Object>> sourcesList = relevantNotes.stream()
                                .map(n -> Map.<String, Object>of(
                                                "noteId", n.getNoteId(),
                                                "title", n.getTitle(),
                                                "similarity", n.getSimilarity()))
                                .collect(Collectors.toList());

                String sourcesJson;
                try {
                        sourcesJson = objectMapper
                                        .writeValueAsString(Map.of("type", "sources", "sources", sourcesList));
                } catch (Exception e) {
                        sourcesJson = "{}";
                }

                if (relevantNotes.isEmpty()) {
                        try {
                                String contentJson = objectMapper.writeValueAsString(Map.of(
                                                "type", "content",
                                                "content",
                                                "I don't have enough context from your notes to answer this question. Try saving some notes first, and I'll be able to help you find and connect ideas!"));
                                return Flux.just(sourcesJson, contentJson);
                        } catch (Exception e) {
                                return Flux.empty();
                        }
                }

                String context = relevantNotes.stream()
                                .map(n -> String.format("--- Note: \"%s\" (relevance: %.0f%%) ---\n%s",
                                                n.getTitle(),
                                                n.getSimilarity() * 100,
                                                n.getContentPreview()))
                                .collect(Collectors.joining("\n\n"));

                String fullSystemPrompt = SYSTEM_PROMPT + "\n" + context;

                List<String> models = List.of(chatModel);

                Flux<String> stream = tryModelStream(models, 0, fullSystemPrompt, request.getQuestion());

                return Flux.concat(Mono.just(sourcesJson), stream);
        }

        private Flux<String> tryModelStream(List<String> models, int index, String systemPrompt, String userMessage) {
                if (index >= models.size()) {
                        try {
                                return Flux.just(objectMapper.writeValueAsString(Map.of(
                                                "type", "content",
                                                "content",
                                                "\n\n*(Error: AI is temporarily overloaded. Please try again later.)*")));
                        } catch (Exception e) {
                                return Flux.empty();
                        }
                }
                String model = models.get(index);
                log.info("Attempting stream with model: {}", model);

                Map<String, Object> requestBody = Map.of(
                                "model", model,
                                "stream", true,
                                "messages", List.of(
                                                Map.of("role", "system", "content", systemPrompt),
                                                Map.of("role", "user", "content", userMessage)),
                                "temperature", 0.3,
                                "max_tokens", 1000);

                return aiWebClient.post()
                                .uri("/chat/completions")
                                .bodyValue(requestBody)
                                .accept(MediaType.TEXT_EVENT_STREAM)
                                .retrieve()
                                .bodyToFlux(String.class)
                                .filter(line -> line != null && line.length() > 0 && !line.equals("[DONE]"))
                                .flatMap(json -> {
                                        try {
                                                JsonNode root = objectMapper.readTree(json);
                                                if (root.has("error")) {
                                                        throw new RuntimeException(
                                                                        "API Error: " + root.get("error").toString());
                                                }
                                                JsonNode choices = root.get("choices");
                                                if (choices != null && choices.size() > 0) {
                                                        JsonNode delta = choices.get(0).get("delta");
                                                        if (delta != null && delta.has("content")) {
                                                                String content = delta.get("content").asText();
                                                                return Mono.just(objectMapper.writeValueAsString(Map.of(
                                                                                "type", "content",
                                                                                "content", content)));
                                                        }
                                                }
                                        } catch (Exception e) {
                                                // Ignore parse errors for partial chunks, OpenRouter might return weird
                                                // 200s
                                        }
                                        return Mono.empty();
                                })
                                .timeout(Duration.ofSeconds(15))
                                .onErrorResume(e -> {
                                        log.warn("Model {} stream failed or rate-limited: {}. Trying next model...",
                                                        model, e.getMessage());
                                        return Mono.delay(Duration.ofSeconds(2)).thenMany(
                                                        tryModelStream(models, index + 1, systemPrompt, userMessage));
                                });
        }

        /**
         * Calls the OpenRouter API with exponential backoff retry.
         * OpenRouter rate-limits per API key (not per model), so the ONLY
         * solution is to WAIT and retry the same request after the cooldown.
         * Backoff: 3s -> 6s -> 12s -> 24s
         */
        private String callChatApiWithRetry(String systemPrompt, String userMessage) {
                // Models to try in order — only switch model on 400/404 (model broken)
                List<String> models = List.of(chatModel);

                for (String model : models) {
                        String result = callWithBackoff(model, systemPrompt, userMessage);
                        if (result != null) {
                                return result;
                        }
                }

                return "I'm sorry, the AI service is temporarily overloaded. Please wait about 30 seconds and try again. "
                                + "This happens because we use a free AI tier with rate limits.";
        }

        /**
         * Try a single model with exponential backoff on 429 errors.
         * Returns null only if the model itself is broken (400/404) — move to next
         * model.
         * Returns the answer string on success.
         */
        @SuppressWarnings("unchecked")
        private String callWithBackoff(String model, String systemPrompt, String userMessage) {
                Map<String, Object> requestBody = Map.of(
                                "model", model,
                                "messages", List.of(
                                                Map.of("role", "system", "content", systemPrompt),
                                                Map.of("role", "user", "content", userMessage)),
                                "temperature", 0.3,
                                "max_tokens", 1000);

                for (int attempt = 0; attempt < MAX_RETRIES; attempt++) {
                        try {
                                // Use exchangeToMono for manual status code handling (no auto-throw on 4xx)
                                Map<String, Object> response = aiWebClient.post()
                                                .uri("/chat/completions")
                                                .bodyValue(requestBody)
                                                .exchangeToMono(clientResponse -> {
                                                        HttpStatusCode status = clientResponse.statusCode();

                                                        if (status.is2xxSuccessful()) {
                                                                return clientResponse.bodyToMono(Map.class);
                                                        }

                                                        return clientResponse.bodyToMono(String.class)
                                                                        .defaultIfEmpty("")
                                                                        .flatMap(body -> {
                                                                                int code = status.value();
                                                                                log.warn("API returned {} for model {}: {}",
                                                                                                code, model,
                                                                                                body.length() > 200
                                                                                                                ? body.substring(
                                                                                                                                0,
                                                                                                                                200)
                                                                                                                : body);
                                                                                if (code == 429) {
                                                                                        if (body.contains("upstream")) {
                                                                                                // Upstream provider is
                                                                                                // out of capacity, so
                                                                                                // falling back to
                                                                                                // another model is best
                                                                                                return Mono.just(Map.of(
                                                                                                                "__error_type",
                                                                                                                "model_error"));
                                                                                        }
                                                                                        return Mono.just(Map.of(
                                                                                                        "__error_type",
                                                                                                        "rate_limited"));
                                                                                } else if (code == 400 || code == 404) {
                                                                                        return Mono.just(Map.of(
                                                                                                        "__error_type",
                                                                                                        "model_error"));
                                                                                } else {
                                                                                        return Mono.just(Map.of(
                                                                                                        "__error_type",
                                                                                                        "unknown"));
                                                                                }
                                                                        });
                                                })
                                                .block(Duration.ofSeconds(30));

                                if (response == null) {
                                        log.warn("Null response from API for model {}", model);
                                        return null;
                                }

                                // Handle error responses
                                Object errorType = response.get("__error_type");
                                if (errorType != null) {
                                        if ("rate_limited".equals(errorType)) {
                                                long waitMs = INITIAL_BACKOFF_MS * (long) Math.pow(2, attempt);
                                                log.info("Rate limited on {} (attempt {}/{}). Waiting {}ms...",
                                                                model, attempt + 1, MAX_RETRIES, waitMs);
                                                Thread.sleep(waitMs);
                                                continue; // RETRY same model after waiting
                                        } else if ("model_error".equals(errorType)) {
                                                log.warn("Model {} is broken (400/404). Trying next model.", model);
                                                return null; // try next model
                                        } else {
                                                return null; // try next model
                                        }
                                }

                                // SUCCESS — extract the answer
                                Object choicesObj = response.get("choices");
                                if (choicesObj instanceof List<?> choicesList && !choicesList.isEmpty()) {
                                        Map<String, Object> firstChoice = (Map<String, Object>) choicesList.get(0);
                                        Map<String, Object> message = (Map<String, Object>) firstChoice.get("message");
                                        if (message != null && message.get("content") != null) {
                                                String content = (String) message.get("content");
                                                log.info("AI response received from model {} on attempt {}", model,
                                                                attempt + 1);
                                                return content;
                                        }
                                }

                                log.warn("Unexpected response structure from model {}: {}", model, response.keySet());
                                return null;

                        } catch (InterruptedException ie) {
                                Thread.currentThread().interrupt();
                                log.error("Thread interrupted during backoff wait");
                                return "AI request was interrupted. Please try again.";
                        } catch (Exception e) {
                                log.error("Exception calling model {}: {}", model, e.getMessage());
                                return null;
                        }
                }

                log.warn("All {} retries exhausted for model {} (rate limited)", MAX_RETRIES, model);
                return null;
        }
}
