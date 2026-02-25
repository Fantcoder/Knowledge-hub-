package com.knowledgehub.repository;

import com.knowledgehub.entity.Link;
import com.knowledgehub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LinkRepository extends JpaRepository<Link, Long> {
    List<Link> findByUserOrderByCreatedAtDesc(User user);
    Optional<Link> findByIdAndUser(Long id, User user);
}
