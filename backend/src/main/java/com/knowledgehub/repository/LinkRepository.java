package com.knowledgehub.repository;

import com.knowledgehub.entity.Link;
import com.knowledgehub.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LinkRepository extends JpaRepository<Link, Long> {

    // Paginated
    Page<Link> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    // Non-paginated (for export)
    List<Link> findByUserOrderByCreatedAtDesc(User user);

    Optional<Link> findByIdAndUser(Long id, User user);
}
