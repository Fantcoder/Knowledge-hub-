package com.knowledgehub.repository;

import com.knowledgehub.entity.FileEntity;
import com.knowledgehub.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileRepository extends JpaRepository<FileEntity, Long> {

    // Paginated
    Page<FileEntity> findByUserOrderByUploadDateDesc(User user, Pageable pageable);

    // Non-paginated (for internal use)
    List<FileEntity> findByUser(User user);

    Optional<FileEntity> findByIdAndUser(Long id, User user);

    List<FileEntity> findByNoteId(Long noteId);
}
