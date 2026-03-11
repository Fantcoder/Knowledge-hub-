package com.knowledgehub.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiTaggingService {

    private final WebClient aiWebClient;
    private final ObjectMapper objectMapper;

    // We specifically want a fast, intelligent model for structured JSON output.
    // Llama 3.3 70B (via Groq/OpenRouter) is currently best-in-class for strict
    // JSON extraction among open-source.
    @Value("${ai.chat-model:meta-llama/llama-3.3-70b-instruct:free}")
    private String taggingModelStr;

    private static final String TAGGING_SYSTEM_PROMPT = """
            You are an expert taxonomist and semantic analyzer.
            Your ONLY job is to read the user's note, extract its core themes, and generate exactly 1 to 4 highly-relevant tags.

            RULES:
            1. Tags must be short (1-2 words max). Use snake_case or standard format (e.g. 'machine_learning', 'react', 'startup_idea').
            2. You MUST output ONLY a valid JSON array of strings. No markdown formatting, no code blocks, no explanation text whatsoever.
            3. Example Valid Output: ["psychology", "mental_models"]
            """;

    /**
     * Synchronously calls the LLM to generate tags for the given content.
     */
    public List<String> generateTagsForContent(String noteTitle, String noteContent) {
        String input = String.format("TITLE: %s\n\nCONTENT: %s",
                noteTitle != null ? noteTitle : "Untitled",
                noteContent != null ? noteContent : "");

        Map<String, Object> requestBody = Map.of(
                "model", taggingModelStr,
                "messages", List.of(
                        Map.of("role", "system", "content", TAGGING_SYSTEM_PROMPT),
                        Map.of("role", "user", "content", input)),
                "temperature", 0.1, // Low temp for highly deterministic JSON output
                "max_tokens", 50);

        try {
            Map<String, Object> response = aiWebClient.post()
                    .uri("/chat/completions")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null && response.containsKey("choices")) {
                List<?> choices = (List<?>) response.get("choices");
                if (!choices.isEmpty()) {
                    Map<?, ?> firstChoice = (Map<?, ?>) choices.get(0);
                    Map<?, ?> message = (Map<?, ?>) firstChoice.get("message");
                    String contentString = (String) message.get("content");
                    return parseJsonArrayFast(contentString);
                }
            }
        } catch (Exception e) {
            log.warn("AI Tagging failed silently (rate limit or network error). Skipping tags: {}", e.getMessage());
        }

        return new ArrayList<>(); // Return empty list rather than breaking if AI fails
    }

    /**
     * Aggressively tries to extract the JSON array even if the LLM hallucinated
     * markdown ticks around it.
     */
    private List<String> parseJsonArrayFast(String rawOutput) {
        try {
            // Fast happy-path
            return objectMapper.readValue(rawOutput, new TypeReference<List<String>>() {
            });
        } catch (JsonProcessingException e) {
            // LLM hallucinated, try extracting just the array using Regex
            log.debug("LLM JSON serialization issue, attempting regex extraction. Raw: {}", rawOutput);
            try {
                Pattern pattern = Pattern.compile("\\[.*?\\]", Pattern.DOTALL);
                Matcher matcher = pattern.matcher(rawOutput);
                if (matcher.find()) {
                    String jsonArrayStr = matcher.group();
                    return objectMapper.readValue(jsonArrayStr, new TypeReference<List<String>>() {
                    });
                }
            } catch (Exception ex) {
                log.warn("Regex fallback failed to parse tags array from LLM");
            }
        }
        return new ArrayList<>();
    }
}
