package com.knowledgehub.ai.service;

import com.knowledgehub.ai.entity.NoteEmbedding;
import com.knowledgehub.ai.repository.NoteEmbeddingRepository;
import com.knowledgehub.entity.Note;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmbeddingService {

    private final WebClient openAiWebClient;
    private final NoteEmbeddingRepository embeddingRepository;

    @Value("${openai.embedding-model:text-embedding-3-small}")
    private String embeddingModel;

    /**
     * Generate embedding vector for arbitrary text via OpenAI API.
     * Returns a 1536-dimension float array.
     */
    public float[] generateEmbedding(String text) {
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("Cannot generate embedding for empty text");
        }

        // Truncate to ~8000 tokens (~32000 chars) to stay within model limits
        String truncated = text.length() > 32000 ? text.substring(0, 32000) : text;

        try {
            Map<String, Object> request = Map.of(
                    "model", embeddingModel,
                    "input", truncated);

            Map response = openAiWebClient.post()
                    .uri("/embeddings")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null || !response.containsKey("data")) {
                throw new RuntimeException("Empty response from OpenAI embedding API");
            }

            List<Map<String, Object>> data = (List<Map<String, Object>>) response.get("data");
            List<Number> embedding = (List<Number>) data.get(0).get("embedding");

            float[] vector = new float[embedding.size()];
            for (int i = 0; i < embedding.size(); i++) {
                vector[i] = embedding.get(i).floatValue();
            }

            log.debug("Generated {}-dim embedding for text ({} chars)", vector.length, text.length());
            return vector;

        } catch (Exception e) {
            log.error("Failed to generate embedding: {}", e.getMessage());
            throw new RuntimeException("Embedding generation failed", e);
        }
    }

    /**
     * Embed a note asynchronously. Called after note create/update.
     * Skips re-embedding if content hasn't changed.
     */
    @Async
    @Transactional
    public void embedNoteAsync(Note note) {
        try {
            embedNote(note);
        } catch (Exception e) {
            log.error("Async embedding failed for note {}: {}", note.getId(), e.getMessage());
        }
    }

    /**
     * Embed a note synchronously.
     */
    @Transactional
    public void embedNote(Note note) {
        // Build the text to embed: title + plain text content
        String plainContent = stripHtml(note.getContent());
        String textToEmbed = note.getTitle() + "\n\n" + plainContent;

        // Compute content hash to skip re-embedding if unchanged
        String contentHash = sha256(textToEmbed);
        if (embeddingRepository.existsByNoteIdAndContentHash(note.getId(), contentHash)) {
            log.debug("Skipping embedding for note {} — content unchanged", note.getId());
            return;
        }

        // Generate the embedding
        float[] vector = generateEmbedding(textToEmbed);

        // Store or update
        NoteEmbedding embedding = embeddingRepository.findByNoteId(note.getId())
                .orElse(NoteEmbedding.builder().note(note).build());

        embedding.setVector(vector);
        embedding.setContentHash(contentHash);
        embedding.setEmbeddingModel(embeddingModel);

        embeddingRepository.save(embedding);
        log.info("Embedded note {} ({} dimensions)", note.getId(), vector.length);
    }

    /**
     * Strip HTML tags to get plain text for embedding.
     */
    private String stripHtml(String html) {
        if (html == null)
            return "";
        return Jsoup.parse(html).text();
    }

    /**
     * SHA-256 hash of content for change detection.
     */
    private String sha256(String text) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(text.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            return String.valueOf(text.hashCode());
        }
    }

    /**
     * Compute cosine similarity between two vectors.
     */
    public static double cosineSimilarity(float[] a, float[] b) {
        if (a.length != b.length)
            return 0;
        double dotProduct = 0, normA = 0, normB = 0;
        for (int i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        double denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator == 0 ? 0 : dotProduct / denominator;
    }
}
