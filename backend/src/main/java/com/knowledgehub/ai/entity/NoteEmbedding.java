package com.knowledgehub.ai.entity;

import com.knowledgehub.entity.Note;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "note_embeddings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoteEmbedding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id", nullable = false, unique = true)
    private Note note;

    // Store as comma-separated floats in TEXT column (MySQL JSON alternative)
    @Column(name = "embedding_vector", nullable = false, columnDefinition = "LONGTEXT")
    private String embeddingVector;

    @Column(name = "embedding_model", length = 50)
    @Builder.Default
    private String embeddingModel = "text-embedding-3-small";

    @Column(name = "content_hash", length = 64)
    private String contentHash;

    @Column(name = "vector_dimension")
    @Builder.Default
    private Integer vectorDimension = 1536;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Parse stored vector string back to float array
     */
    public float[] getVector() {
        if (embeddingVector == null || embeddingVector.isBlank())
            return new float[0];
        String[] parts = embeddingVector.split(",");
        float[] vec = new float[parts.length];
        for (int i = 0; i < parts.length; i++) {
            vec[i] = Float.parseFloat(parts[i].trim());
        }
        return vec;
    }

    /**
     * Store float array as comma-separated string
     */
    public void setVector(float[] vector) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < vector.length; i++) {
            if (i > 0)
                sb.append(',');
            sb.append(vector[i]);
        }
        this.embeddingVector = sb.toString();
        this.vectorDimension = vector.length;
    }
}
