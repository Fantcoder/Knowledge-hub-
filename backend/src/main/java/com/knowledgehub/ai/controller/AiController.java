package com.knowledgehub.ai.controller;

import com.knowledgehub.ai.dto.ChatRequest;
import com.knowledgehub.ai.dto.ChatResponse;
import com.knowledgehub.ai.dto.SemanticSearchResult;
import com.knowledgehub.ai.service.AiChatService;
import com.knowledgehub.ai.service.EmbeddingService;
import com.knowledgehub.ai.service.SemanticSearchService;
import com.knowledgehub.dto.response.ApiResponse;
import com.knowledgehub.entity.Note;
import com.knowledgehub.entity.User;
import com.knowledgehub.exception.ResourceNotFoundException;
import com.knowledgehub.repository.NoteRepository;
import com.knowledgehub.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class AiController {

    private final AiChatService chatService;
    private final SemanticSearchService searchService;
    private final EmbeddingService embeddingService;
    private final UserRepository userRepository;
    private final NoteRepository noteRepository;

    /**
     * POST /api/ai/chat — Chat with your notes
     * The killer feature: ask questions, get answers sourced from YOUR notes.
     */
    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<ChatResponse>> chat(@Valid @RequestBody ChatRequest request) {
        User user = getCurrentUser();
        ChatResponse response = chatService.chat(user, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * POST /api/ai/chat/stream — Stream the AI chat response word-by-word
     */
    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> chatStream(@Valid @RequestBody ChatRequest request) {
        User user = getCurrentUser();
        return chatService.chatStream(user, request);
    }

    /**
     * GET /api/ai/search?q=...&limit=10 — Semantic search
     * Finds notes by meaning, not just keywords.
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<SemanticSearchResult>>> semanticSearch(
            @RequestParam String q,
            @RequestParam(defaultValue = "10") int limit) {
        User user = getCurrentUser();
        List<SemanticSearchResult> results = searchService.search(user, q, limit);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    /**
     * POST /api/ai/embed/{noteId} — Manually trigger embedding for a specific note
     */
    @PostMapping("/embed/{noteId}")
    public ResponseEntity<ApiResponse<Map<String, String>>> embedNote(@PathVariable Long noteId) {
        User user = getCurrentUser();
        Note note = noteRepository.findByIdAndUser(noteId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Note", noteId));
        embeddingService.embedNote(note);
        return ResponseEntity.ok(ApiResponse.success("Note embedded successfully",
                Map.of("noteId", noteId.toString(), "status", "embedded")));
    }

    /**
     * POST /api/ai/embed-all — Embed all of the user's notes (batch)
     * Useful for first-time setup or re-indexing.
     */
    @PostMapping("/embed-all")
    public ResponseEntity<ApiResponse<Map<String, Object>>> embedAllNotes() {
        User user = getCurrentUser();
        List<Note> notes = noteRepository
                .findByUserAndIsDeletedFalseAndIsArchivedFalseOrderByIsPinnedDescUpdatedAtDesc(user);

        int count = 0;
        for (Note note : notes) {
            try {
                embeddingService.embedNote(note);
                count++;
            } catch (Exception e) {
                log.error("Failed to embed note {}: {}", note.getId(), e.getMessage());
            }
        }

        return ResponseEntity.ok(ApiResponse.success("Embedding complete",
                Map.of("totalNotes", notes.size(), "embedded", count)));
    }

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
