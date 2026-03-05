package com.knowledgehub.ai.repository;

import com.knowledgehub.ai.entity.NoteEmbedding;
import com.knowledgehub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoteEmbeddingRepository extends JpaRepository<NoteEmbedding, Long> {

    Optional<NoteEmbedding> findByNoteId(Long noteId);

    @Query("SELECT ne FROM NoteEmbedding ne WHERE ne.note.user = :user AND ne.note.isDeleted = false")
    List<NoteEmbedding> findAllByUser(@Param("user") User user);

    void deleteByNoteId(Long noteId);

    boolean existsByNoteIdAndContentHash(Long noteId, String contentHash);
}
