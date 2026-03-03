package com.knowledgehub.service;

import com.knowledgehub.dto.request.LinkRequest;
import com.knowledgehub.dto.response.LinkResponse;
import com.knowledgehub.entity.Link;
import com.knowledgehub.entity.Note;
import com.knowledgehub.entity.User;
import com.knowledgehub.exception.ResourceNotFoundException;
import com.knowledgehub.repository.LinkRepository;
import com.knowledgehub.repository.NoteRepository;
import com.knowledgehub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LinkService {

    private final LinkRepository linkRepository;
    private final UserRepository userRepository;
    private final NoteRepository noteRepository;

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Transactional
    public LinkResponse createLink(LinkRequest request) {
        User user = getCurrentUser();

        Note note = null;
        if (request.getNoteId() != null) {
            note = noteRepository.findByIdAndUser(request.getNoteId(), user).orElse(null);
        }

        Link link = Link.builder()
                .url(request.getUrl())
                .title(request.getTitle())
                .description(request.getDescription())
                .faviconUrl(request.getFaviconUrl())
                .user(user)
                .note(note)
                .build();

        return toResponse(linkRepository.save(link));
    }

    // Paginated (for API)
    @Transactional(readOnly = true)
    public Page<LinkResponse> getLinksPaged(Pageable pageable) {
        User user = getCurrentUser();
        return linkRepository.findByUserOrderByCreatedAtDesc(user, pageable)
                .map(this::toResponse);
    }

    // Non-paginated (for export)
    @Transactional(readOnly = true)
    public List<LinkResponse> getLinks() {
        User user = getCurrentUser();
        return linkRepository.findByUserOrderByCreatedAtDesc(user)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public LinkResponse updateLink(Long id, LinkRequest request) {
        User user = getCurrentUser();
        Link link = linkRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Link", id));

        link.setUrl(request.getUrl());
        link.setTitle(request.getTitle());
        link.setDescription(request.getDescription());
        link.setFaviconUrl(request.getFaviconUrl());

        if (request.getNoteId() != null) {
            Note note = noteRepository.findByIdAndUser(request.getNoteId(), user).orElse(null);
            link.setNote(note);
        } else {
            link.setNote(null);
        }

        return toResponse(linkRepository.save(link));
    }

    @Transactional
    public void deleteLink(Long id) {
        User user = getCurrentUser();
        Link link = linkRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Link", id));
        linkRepository.delete(link);
    }

    private LinkResponse toResponse(Link link) {
        return LinkResponse.builder()
                .id(link.getId())
                .url(link.getUrl())
                .title(link.getTitle())
                .description(link.getDescription())
                .faviconUrl(link.getFaviconUrl())
                .createdAt(link.getCreatedAt())
                .noteId(link.getNote() != null ? link.getNote().getId() : null)
                .build();
    }
}
