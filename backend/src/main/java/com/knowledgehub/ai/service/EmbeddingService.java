package com.knowledgehub.ai.service;

import com.knowledgehub.ai.entity.NoteEmbedding;
import com.knowledgehub.ai.repository.NoteEmbeddingRepository;
import com.knowledgehub.entity.Note;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

/**
 * Local Embedding Service — generates keyword-based embeddings
 * entirely on-device with ZERO API calls (free forever).
 *
 * Uses feature hashing ("hashing trick") to convert text into
 * a fixed-dimension vector. Each word is hashed to a position
 * in the vector, weighted by frequency and normalized.
 *
 * This powers semantic-ish search by matching keyword overlap
 * between notes — not as smart as OpenAI embeddings but 100% free.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmbeddingService {

    private final NoteEmbeddingRepository embeddingRepository;

    private static final int VECTOR_DIM = 512; // Fixed vector dimension
    private static final Set<String> STOP_WORDS = Set.of(
            "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
            "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
            "being", "have", "has", "had", "do", "does", "did", "will", "would",
            "could", "should", "may", "might", "shall", "can", "it", "its",
            "this", "that", "these", "those", "i", "me", "my", "we", "our",
            "you", "your", "he", "she", "him", "her", "his", "they", "them",
            "their", "what", "which", "who", "when", "where", "why", "how",
            "not", "no", "if", "then", "so", "as", "about", "up", "out",
            "just", "also", "than", "more", "some", "any", "all", "each",
            "every", "both", "few", "many", "much", "very", "too", "only",
            "own", "same", "other", "such", "into", "over", "after", "before",
            "between", "through", "during", "here", "there", "again", "once",
            "p", "br", "div", "span", "nbsp", "amp", "lt", "gt" // HTML remnants
    );

    /**
     * Generate a local embedding vector for text.
     * Uses feature hashing — each word hashes to a bucket in a
     * fixed-dimension vector, weighted by TF (term frequency).
     */
    public float[] generateEmbedding(String text) {
        if (text == null || text.isBlank()) {
            return new float[VECTOR_DIM];
        }

        // Tokenize: lowercase, split on non-alphanumeric, filter stop words
        String[] tokens = text.toLowerCase()
                .replaceAll("[^a-z0-9\\s]", " ")
                .split("\\s+");

        float[] vector = new float[VECTOR_DIM];
        int totalTokens = 0;

        for (String token : tokens) {
            if (token.length() < 2 || token.length() > 30 || STOP_WORDS.contains(token)) {
                continue;
            }
            totalTokens++;

            // Hash token to bucket index (deterministic)
            int hash = Math.abs(token.hashCode());
            int bucket = hash % VECTOR_DIM;

            // Use secondary hash for sign (reduces collision impact)
            float sign = ((hash / VECTOR_DIM) % 2 == 0) ? 1.0f : -1.0f;
            vector[bucket] += sign;

            // Also hash bigrams (2-char prefix + length) for more signal
            if (token.length() >= 3) {
                String prefix = token.substring(0, 3);
                int prefixHash = Math.abs(prefix.hashCode());
                int prefixBucket = prefixHash % VECTOR_DIM;
                vector[prefixBucket] += sign * 0.5f;
            }
        }

        // Normalize to unit vector (for cosine similarity)
        if (totalTokens > 0) {
            float norm = 0;
            for (float v : vector)
                norm += v * v;
            norm = (float) Math.sqrt(norm);
            if (norm > 0) {
                for (int i = 0; i < vector.length; i++) {
                    vector[i] /= norm;
                }
            }
        }

        log.debug("Generated local {}-dim embedding ({} meaningful tokens)", VECTOR_DIM, totalTokens);
        return vector;
    }

    /**
     * Embed a note asynchronously. Called after note create/update.
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
        String plainContent = stripHtml(note.getContent());
        // Weight title more heavily by repeating it
        String textToEmbed = note.getTitle() + " " + note.getTitle() + " " + note.getTitle() + "\n\n" + plainContent;

        String contentHash = sha256(textToEmbed);
        if (embeddingRepository.existsByNoteIdAndContentHash(note.getId(), contentHash)) {
            log.debug("Skipping embedding for note {} — content unchanged", note.getId());
            return;
        }

        float[] vector = generateEmbedding(textToEmbed);

        NoteEmbedding embedding = embeddingRepository.findByNoteId(note.getId())
                .orElse(NoteEmbedding.builder().note(note).build());

        embedding.setVector(vector);
        embedding.setContentHash(contentHash);
        embedding.setEmbeddingModel("local-feature-hash-v1");
        embedding.setVectorDimension(VECTOR_DIM);

        embeddingRepository.save(embedding);
        log.info("Embedded note {} ({} dims, local)", note.getId(), VECTOR_DIM);
    }

    private String stripHtml(String html) {
        if (html == null)
            return "";
        return Jsoup.parse(html).text();
    }

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
     * Cosine similarity between two vectors.
     */
    public static double cosineSimilarity(float[] a, float[] b) {
        int len = Math.min(a.length, b.length);
        double dotProduct = 0, normA = 0, normB = 0;
        for (int i = 0; i < len; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        double denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator == 0 ? 0 : dotProduct / denominator;
    }
}
