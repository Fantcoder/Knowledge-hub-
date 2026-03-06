package com.knowledgehub.ai.service;

import com.knowledgehub.ai.dto.SemanticSearchResult;
import com.knowledgehub.ai.entity.NoteEmbedding;
import com.knowledgehub.ai.repository.NoteEmbeddingRepository;
import com.knowledgehub.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SemanticSearchService {

    private final EmbeddingService embeddingService;
    private final NoteEmbeddingRepository embeddingRepository;

    /**
     * Search user's notes by semantic similarity.
     * 1. Convert query → embedding vector
     * 2. Compute cosine similarity against all user's note embeddings
     * 3. Return top-K most similar notes
     */
    @Transactional(readOnly = true)
    public List<SemanticSearchResult> search(User user, String query, int topK) {
        log.info("Semantic search for user {}: '{}'", user.getUsername(), query);

        // 1. Generate query embedding
        float[] queryVector = embeddingService.generateEmbedding(query);

        // 2. Get all user's note embeddings
        List<NoteEmbedding> allEmbeddings = embeddingRepository.findAllByUser(user);

        if (allEmbeddings.isEmpty()) {
            log.info("No embeddings found for user {}", user.getUsername());
            return List.of();
        }

        // 3. Compute similarity for each, sort, and take top K
        List<SemanticSearchResult> results = allEmbeddings.stream()
                .map(ne -> {
                    double similarity = EmbeddingService.cosineSimilarity(queryVector, ne.getVector());
                    String preview = ne.getNote().getContentPreview() != null
                            ? ne.getNote().getContentPreview()
                            : generatePreview(ne.getNote().getContent());
                    return SemanticSearchResult.builder()
                            .noteId(ne.getNote().getId())
                            .title(ne.getNote().getTitle())
                            .contentPreview(preview)
                            .similarity(similarity)
                            .tags(ne.getNote().getTags().stream()
                                    .map(t -> t.getName())
                                    .sorted()
                                    .collect(Collectors.toList()))
                            .build();
                })
                .filter(r -> r.getSimilarity() > 0.0) // Lower threshold to allow any overlap
                .sorted(Comparator.comparingDouble(SemanticSearchResult::getSimilarity).reversed())
                .limit(topK)
                .collect(Collectors.toList());

        // 4. Fallback: If no notes matched the search keywords (e.g., general
        // question),
        // return the user's most recently updated notes as context so the AI can still
        // operate!
        if (results.isEmpty() && !allEmbeddings.isEmpty()) {
            log.info("No strict semantic overlap. Falling back to most recent notes for context.");
            return allEmbeddings.stream()
                    .sorted((a, b) -> b.getNote().getUpdatedAt().compareTo(a.getNote().getUpdatedAt()))
                    .limit(topK)
                    .map(ne -> {
                        String preview = ne.getNote().getContentPreview() != null
                                ? ne.getNote().getContentPreview()
                                : generatePreview(ne.getNote().getContent());
                        return SemanticSearchResult.builder()
                                .noteId(ne.getNote().getId())
                                .title(ne.getNote().getTitle())
                                .contentPreview(preview)
                                .similarity(0.01) // Small non-zero score for fallback
                                .tags(ne.getNote().getTags().stream()
                                        .map(t -> t.getName())
                                        .sorted()
                                        .collect(Collectors.toList()))
                                .build();
                    })
                    .collect(Collectors.toList());
        }

        return results;
    }

    private String generatePreview(String htmlContent) {
        if (htmlContent == null)
            return "";
        String text = org.jsoup.Jsoup.parse(htmlContent).text();
        return text.length() > 200 ? text.substring(0, 200) + "..." : text;
    }
}
