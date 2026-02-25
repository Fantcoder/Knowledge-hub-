package com.knowledgehub.service;

import com.knowledgehub.dto.response.TagResponse;
import com.knowledgehub.entity.Tag;
import com.knowledgehub.entity.User;
import com.knowledgehub.exception.ResourceNotFoundException;
import com.knowledgehub.repository.TagRepository;
import com.knowledgehub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Transactional(readOnly = true)
    public List<TagResponse> getTags() {
        User user = getCurrentUser();
        return tagRepository.findByUser(user)
                .stream()
                .map(t -> TagResponse.builder().id(t.getId()).name(t.getName()).build())
                .collect(Collectors.toList());
    }

    @Transactional
    public TagResponse createTag(String name) {
        User user = getCurrentUser();
        String trimmedName = name.trim().toLowerCase();

        if (tagRepository.existsByNameAndUser(trimmedName, user)) {
            throw new IllegalArgumentException("Tag '" + trimmedName + "' already exists");
        }

        Tag tag = tagRepository.save(Tag.builder().name(trimmedName).user(user).build());
        return TagResponse.builder().id(tag.getId()).name(tag.getName()).build();
    }

    @Transactional
    public void deleteTag(Long id) {
        User user = getCurrentUser();
        Tag tag = tagRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Tag", id));
        tagRepository.delete(tag);
    }
}
