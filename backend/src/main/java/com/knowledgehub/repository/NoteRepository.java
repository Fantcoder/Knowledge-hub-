package com.knowledgehub.repository;

import com.knowledgehub.entity.Note;
import com.knowledgehub.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {

       // ── Paginated queries (used by controllers) ──────────────────────────

       Page<Note> findByUserAndIsDeletedFalseAndIsArchivedFalseOrderByIsPinnedDescUpdatedAtDesc(
                     User user, Pageable pageable);

       Page<Note> findByUserAndIsDeletedFalseAndIsArchivedTrueOrderByUpdatedAtDesc(
                     User user, Pageable pageable);

       Page<Note> findByUserAndIsDeletedTrueOrderByUpdatedAtDesc(
                     User user, Pageable pageable);

       Page<Note> findByUserAndIsPinnedTrueAndIsDeletedFalseOrderByUpdatedAtDesc(
                     User user, Pageable pageable);

       @Query("SELECT DISTINCT n FROM Note n WHERE n.user = :user AND n.isDeleted = false " +
                     "AND (n.title LIKE :pattern OR n.content LIKE :pattern) ORDER BY n.updatedAt DESC")
       Page<Note> searchByQuery(@Param("user") User user, @Param("pattern") String pattern,
                     Pageable pageable);

       @Query("SELECT DISTINCT n FROM Note n JOIN n.tags t WHERE n.user = :user " +
                     "AND n.isDeleted = false AND t.name = :tagName ORDER BY n.updatedAt DESC")
       Page<Note> findByUserAndTagName(@Param("user") User user, @Param("tagName") String tagName,
                     Pageable pageable);

       @Query("SELECT DISTINCT n FROM Note n JOIN n.tags t WHERE n.user = :user AND n.isDeleted = false " +
                     "AND (n.title LIKE :pattern OR n.content LIKE :pattern) " +
                     "AND t.name = :tagName ORDER BY n.updatedAt DESC")
       Page<Note> searchByQueryAndTag(@Param("user") User user, @Param("pattern") String pattern,
                     @Param("tagName") String tagName, Pageable pageable);

       // ── Non-paginated queries (used by export, internal services) ────────

       List<Note> findByUserAndIsDeletedFalseAndIsArchivedFalseOrderByIsPinnedDescUpdatedAtDesc(User user);

       List<Note> findByUserAndIsDeletedFalseAndIsArchivedTrueOrderByUpdatedAtDesc(User user);

       List<Note> findByUserAndIsDeletedTrueOrderByUpdatedAtDesc(User user);

       List<Note> findByUserAndIsPinnedTrueAndIsDeletedFalseOrderByUpdatedAtDesc(User user);

       @Query("SELECT DISTINCT n FROM Note n WHERE n.user = :user AND n.isDeleted = false " +
                     "AND (n.title LIKE :pattern OR n.content LIKE :pattern)")
       List<Note> searchByQuery(@Param("user") User user, @Param("pattern") String pattern);

       @Query("SELECT DISTINCT n FROM Note n JOIN n.tags t WHERE n.user = :user AND n.isDeleted = false AND t.name = :tagName")
       List<Note> findByUserAndTagName(@Param("user") User user, @Param("tagName") String tagName);

       @Query("SELECT DISTINCT n FROM Note n JOIN n.tags t WHERE n.user = :user AND n.isDeleted = false " +
                     "AND (n.title LIKE :pattern OR n.content LIKE :pattern) " +
                     "AND t.name = :tagName")
       List<Note> searchByQueryAndTag(@Param("user") User user, @Param("pattern") String pattern,
                     @Param("tagName") String tagName);

       // ── Single-item lookups ──────────────────────────────────────────────

       Optional<Note> findByIdAndUser(Long id, User user);
}
