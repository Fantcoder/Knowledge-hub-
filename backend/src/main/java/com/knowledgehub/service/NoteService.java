package com.knowledgehub.service;

import com.knowledgehub.dto.request.NoteRequest;
import com.knowledgehub.dto.response.FileResponse;
import com.knowledgehub.dto.response.NoteResponse;
import com.knowledgehub.entity.Note;
import com.knowledgehub.entity.Tag;
import com.knowledgehub.entity.User;
import com.knowledgehub.exception.ResourceNotFoundException;
import com.knowledgehub.repository.NoteRepository;
import com.knowledgehub.repository.TagRepository;
import com.knowledgehub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;
    private final UserRepository userRepository;
    private final TagRepository tagRepository;

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private String sanitizeContent(String content) {
        if (content == null)
            return null;
        return Jsoup.clean(content, Safelist.relaxed()
                .addAttributes("span", "class")
                .addAttributes("pre", "class")
                .addAttributes("code", "class"));
    }

    private String generatePreview(String htmlContent) {
        if (htmlContent == null)
            return "";
        String text = Jsoup.parse(htmlContent).text();
        return text.length() > 200 ? text.substring(0, 200) + "..." : text;
    }

    @Transactional
    public NoteResponse createNote(NoteRequest request) {
        User user = getCurrentUser();
        Set<Tag> tags = resolveOrCreateTags(request.getTags(), user);

        Note note = Note.builder()
                .title(request.getTitle())
                .content(sanitizeContent(request.getContent()))
                .isPinned(request.getIsPinned() != null && request.getIsPinned())
                .isArchived(request.getIsArchived() != null && request.getIsArchived())
                .user(user)
                .tags(tags)
                .build();

        return toResponse(noteRepository.save(note));
    }

    @Transactional(readOnly = true)
    public List<NoteResponse> getNotes(String filter, String tagName) {
        User user = getCurrentUser();

        if (tagName != null && !tagName.isBlank()) {
            return noteRepository.findByUserAndTagName(user, tagName)
                    .stream().map(this::toResponse).collect(Collectors.toList());
        }

        return switch (filter != null ? filter : "active") {
            case "archived" -> noteRepository.findByUserAndIsDeletedFalseAndIsArchivedTrueOrderByUpdatedAtDesc(user)
                    .stream().map(this::toResponse).collect(Collectors.toList());
            case "deleted" -> noteRepository.findByUserAndIsDeletedTrueOrderByUpdatedAtDesc(user)
                    .stream().map(this::toResponse).collect(Collectors.toList());
            case "pinned" -> noteRepository.findByUserAndIsPinnedTrueAndIsDeletedFalseOrderByUpdatedAtDesc(user)
                    .stream().map(this::toResponse).collect(Collectors.toList());
            default -> noteRepository
                    .findByUserAndIsDeletedFalseAndIsArchivedFalseOrderByIsPinnedDescUpdatedAtDesc(user)
                    .stream().map(this::toResponse).collect(Collectors.toList());
        };
    }

    @Transactional(readOnly = true)
    public NoteResponse getNoteById(Long id) {
        User user = getCurrentUser();
        Note note = noteRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Note", id));
        return toResponse(note);
    }

    @Transactional
    public NoteResponse updateNote(Long id, NoteRequest request) {
        User user = getCurrentUser();
        Note note = noteRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Note", id));

        note.setTitle(request.getTitle());
        note.setContent(sanitizeContent(request.getContent()));

        if (request.getIsPinned() != null)
            note.setIsPinned(request.getIsPinned());
        if (request.getIsArchived() != null)
            note.setIsArchived(request.getIsArchived());

        if (request.getTags() != null) {
            note.setTags(resolveOrCreateTags(request.getTags(), user));
        }

        return toResponse(noteRepository.save(note));
    }

    @Transactional
    public void softDeleteNote(Long id) {
        User user = getCurrentUser();
        Note note = noteRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Note", id));
        note.setIsDeleted(true);
        note.setIsPinned(false);
        noteRepository.save(note);
    }

    @Transactional
    public void permanentDeleteNote(Long id) {
        User user = getCurrentUser();
        Note note = noteRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Note", id));
        noteRepository.delete(note);
    }

    @Transactional
    public NoteResponse restoreNote(Long id) {
        User user = getCurrentUser();
        Note note = noteRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Note", id));
        note.setIsDeleted(false);
        return toResponse(noteRepository.save(note));
    }

    @Transactional
    public NoteResponse togglePin(Long id) {
        User user = getCurrentUser();
        Note note = noteRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Note", id));
        note.setIsPinned(!note.getIsPinned());
        return toResponse(noteRepository.save(note));
    }

    @Transactional
    public NoteResponse toggleArchive(Long id) {
        User user = getCurrentUser();
        Note note = noteRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Note", id));
        note.setIsArchived(!note.getIsArchived());
        if (note.getIsArchived())
            note.setIsPinned(false);
        return toResponse(noteRepository.save(note));
    }

    @Transactional(readOnly = true)
    public List<NoteResponse> searchNotes(String query, String tagName) {
        User user = getCurrentUser();
        List<Note> results;

        // Build a lowercase LIKE pattern — avoids Hibernate 6 lower() JPQL issue
        String pattern = query != null && !query.isBlank()
                ? "%" + query.trim().toLowerCase() + "%"
                : null;
        String tag = tagName != null && !tagName.isBlank() ? tagName.trim().toLowerCase() : null;

        if (pattern != null && tag != null) {
            results = noteRepository.searchByQueryAndTag(user, pattern, tag);
        } else if (pattern != null) {
            results = noteRepository.searchByQuery(user, pattern);
        } else if (tag != null) {
            results = noteRepository.findByUserAndTagName(user, tag);
        } else {
            results = noteRepository
                    .findByUserAndIsDeletedFalseAndIsArchivedFalseOrderByIsPinnedDescUpdatedAtDesc(user);
        }

        return results.stream().map(this::toResponse).collect(Collectors.toList());
    }

    private Set<Tag> resolveOrCreateTags(List<String> tagNames, User user) {
        if (tagNames == null || tagNames.isEmpty())
            return new HashSet<>();
        Set<Tag> tags = new HashSet<>();
        for (String name : tagNames) {
            String trimmedName = name.trim().toLowerCase();
            if (trimmedName.isBlank())
                continue;
            Tag tag = tagRepository.findByNameAndUser(trimmedName, user)
                    .orElseGet(() -> tagRepository.save(
                            Tag.builder().name(trimmedName).user(user).build()));
            tags.add(tag);
        }
        return tags;
    }

    private NoteResponse toResponse(Note note) {
        List<FileResponse> fileResponses = note.getFiles().stream()
                .map(f -> FileResponse.builder()
                        .id(f.getId())
                        .originalName(f.getOriginalName())
                        .fileType(f.getFileType())
                        .fileSize(f.getFileSize())
                        .downloadUrl("/api/files/" + f.getId() + "/download")
                        .uploadDate(f.getUploadDate())
                        .noteId(note.getId())
                        .build())
                .collect(Collectors.toList());

        return NoteResponse.builder()
                .id(note.getId())
                .title(note.getTitle())
                .content(note.getContent())
                .contentPreview(generatePreview(note.getContent()))
                .isPinned(note.getIsPinned())
                .isArchived(note.getIsArchived())
                .isDeleted(note.getIsDeleted())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .tags(note.getTags().stream().map(Tag::getName).sorted().collect(Collectors.toList()))
                .files(fileResponses)
                .build();
    }
}
