package com.knowledgehub.ai.service;

import com.knowledgehub.ai.dto.ChatRequest;
import com.knowledgehub.ai.dto.ChatResponse;
import com.knowledgehub.ai.dto.SemanticSearchResult;
import com.knowledgehub.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiChatService {

        private final WebClient aiWebClient;
        private final SemanticSearchService semanticSearchService;

        @Value("${ai.chat-model:meta-llama/llama-3-8b-instruct:free}")
        private String chatModel;

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

        /**
         * Chat with your notes using RAG (Retrieval Augmented Generation).
         *
         * Flow:
         * 1. Find relevant notes via local keyword search
         * 2. Build context from those notes
         * 3. Send to Llama 3 via OpenRouter
         * 4. Return answer + source references
         */
        public ChatResponse chat(User user, ChatRequest request) {
                log.info("AI chat for user {}: '{}'", user.getUsername(), request.getQuestion());

                // Step 1: Find relevant notes via semantic search
                List<SemanticSearchResult> relevantNotes = semanticSearchService.search(
                                user, request.getQuestion(), 5);

                if (relevantNotes.isEmpty()) {
                        return ChatResponse.builder()
                                        .answer("I don't have enough context from your notes to answer this question. "
                                                        +
                                                        "Try saving some notes first, and I'll be able to help you find and connect ideas!")
                                        .sourceNotes(List.of())
                                        .model(chatModel)
                                        .build();
                }

                // Step 2: Build context from relevant notes
                String context = relevantNotes.stream()
                                .map(n -> String.format("--- Note: \"%s\" (relevance: %.0f%%) ---\n%s",
                                                n.getTitle(),
                                                n.getSimilarity() * 100,
                                                n.getContentPreview()))
                                .collect(Collectors.joining("\n\n"));

                String fullSystemPrompt = SYSTEM_PROMPT + "\n" + context;

                // Step 3: Call Llama 3 via OpenRouter
                String answer = callChatApi(fullSystemPrompt, request.getQuestion());

                // Step 4: Build response with source references
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

        private String callChatApi(String systemPrompt, String userMessage) {
                try {
                        Map<String, Object> request = Map.of(
                                        "model", chatModel,
                                        "messages", List.of(
                                                        Map.of("role", "system", "content", systemPrompt),
                                                        Map.of("role", "user", "content", userMessage)),
                                        "temperature", 0.3,
                                        "max_tokens", 1000);

                        Map response = aiWebClient.post()
                                        .uri("/chat/completions")
                                        .bodyValue(request)
                                        .retrieve()
                                        .bodyToMono(Map.class)
                                        .block();

                        if (response == null) {
                                return "I'm having trouble connecting to the AI service. Please try again.";
                        }

                        List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                        return (String) message.get("content");

                } catch (Exception e) {
                        log.error("Chat API call failed: {}", e.getMessage());
                        return "Sorry, I encountered an error while processing your question. Please try again.";
                }
        }
}
