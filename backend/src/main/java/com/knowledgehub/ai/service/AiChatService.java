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

        public Mono<ChatResponse> chatReactive(User user, ChatRequest request) {
                log.info("AI chat for user {}: '{}'", user.getUsername(), request.getQuestion());

                List<SemanticSearchResult> relevantNotes = semanticSearchService.search(
                                user, request.getQuestion(), 5);

                if (relevantNotes.isEmpty()) {
                        return Mono.just(ChatResponse.builder()
                                        .answer("I don't have enough context from your notes to answer this question. "
                                                        + "Try saving some notes first, and I'll be able to help you find and connect ideas!")
                                        .sourceNotes(List.of())
                                        .model(chatModel)
                                        .build());
                }

                String context = relevantNotes.stream()
                                .map(n -> String.format("--- Note: \"%s\" (relevance: %.0f%%) ---\n%s",
                                                n.getTitle(),
                                                n.getSimilarity() * 100,
                                                n.getContentPreview()))
                                .collect(Collectors.joining("\n\n"));

                String fullSystemPrompt = SYSTEM_PROMPT + "\n" + context;

                List<ChatResponse.SourceNote> sources = relevantNotes.stream()
                                .map(n -> ChatResponse.SourceNote.builder()
                                                .noteId(n.getNoteId())
                                                .title(n.getTitle())
                                                .similarity(n.getSimilarity())
                                                .build())
                                .collect(Collectors.toList());

                return callChatApiWithRetryReactive(fullSystemPrompt, request.getQuestion())
                                .map(answer -> ChatResponse.builder()
                                                .answer(answer)
                                                .sourceNotes(sources)
                                                .model(chatModel)
                                                .build());
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

        private Mono<String> callChatApiWithRetryReactive(String systemPrompt, String userMessage) {
                List<String> models = List.of(chatModel);
                Mono<String> fallback = Mono.just("I'm sorry, the AI service is temporarily overloaded. Please wait about 30 seconds and try again. "
                                + "This happens because we use a free AI tier with rate limits.");
                
                return callWithBackoffReactive(models.get(0), systemPrompt, userMessage, 0)
                                .switchIfEmpty(fallback);
        }

        @SuppressWarnings("unchecked")
        private Mono<String> callWithBackoffReactive(String model, String systemPrompt, String userMessage, int attempt) {
                if (attempt >= MAX_RETRIES) {
                        log.warn("All {} retries exhausted for model {} (rate limited)", MAX_RETRIES, model);
                        return Mono.empty();
                }

                Map<String, Object> requestBody = Map.of(
                                "model", model,
                                "messages", List.of(
                                                Map.of("role", "system", "content", systemPrompt),
                                                Map.of("role", "user", "content", userMessage)),
                                "temperature", 0.3,
                                "max_tokens", 1000);

                return aiWebClient.post()
                                .uri("/chat/completions")
                                .bodyValue(requestBody)
                                .exchangeToMono(clientResponse -> {
                                        HttpStatusCode status = clientResponse.statusCode();

                                        if (status.is2xxSuccessful()) {
                                                return clientResponse.bodyToMono(Map.class).map(response -> {
                                                        Object choicesObj = response.get("choices");
                                                        if (choicesObj instanceof List<?> choicesList && !choicesList.isEmpty()) {
                                                                Map<String, Object> firstChoice = (Map<String, Object>) choicesList.get(0);
                                                                Map<String, Object> message = (Map<String, Object>) firstChoice.get("message");
                                                                if (message != null && message.get("content") != null) {
                                                                        log.info("AI response received from model {} on attempt {}", model, attempt + 1);
                                                                        return (String) message.get("content");
                                                                }
                                                        }
                                                        log.warn("Unexpected response structure from model {}: {}", model, response.keySet());
                                                        return "";
                                                });
                                        }

                                        return clientResponse.bodyToMono(String.class)
                                                        .defaultIfEmpty("")
                                                        .flatMap(body -> {
                                                                int code = status.value();
                                                                log.warn("API returned {} for model {}", code, model);
                                                                if (code == 429) {
                                                                        if (body.contains("upstream")) {
                                                                                return Mono.error(new RuntimeException("model_error"));
                                                                        }
                                                                        return Mono.error(new RuntimeException("rate_limited"));
                                                                } else if (code == 400 || code == 404) {
                                                                        return Mono.error(new RuntimeException("model_error"));
                                                                } else {
                                                                        return Mono.error(new RuntimeException("unknown"));
                                                                }
                                                        });
                                })
                                .timeout(Duration.ofSeconds(30))
                                .onErrorResume(e -> {
                                        if (e instanceof RuntimeException re && "rate_limited".equals(re.getMessage())) {
                                                long waitMs = INITIAL_BACKOFF_MS * (long) Math.pow(2, attempt);
                                                log.info("Rate limited on {} (attempt {}/{}). Waiting {}ms...", model, attempt + 1, MAX_RETRIES, waitMs);
                                                return Mono.delay(Duration.ofMillis(waitMs))
                                                                .flatMap(v -> callWithBackoffReactive(model, systemPrompt, userMessage, attempt + 1));
                                        } else if (e instanceof RuntimeException re && "model_error".equals(re.getMessage())) {
                                                log.warn("Model {} is broken. Trying next model.", model);
                                                return Mono.empty();
                                        } else if (e instanceof java.util.concurrent.TimeoutException) {
                                                log.error("Timeout calling model {}. Waiting and retrying...", model);
                                                long waitMs = INITIAL_BACKOFF_MS * (long) Math.pow(2, attempt);
                                                return Mono.delay(Duration.ofMillis(waitMs))
                                                                .flatMap(v -> callWithBackoffReactive(model, systemPrompt, userMessage, attempt + 1));
                                        } else {
                                                log.error("Exception calling model {}: {}", model, e.getMessage());
                                                return Mono.empty();
                                        }
                                });
        }
}
