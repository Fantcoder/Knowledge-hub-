package com.knowledgehub.controller;

import com.knowledgehub.dto.request.NoteRequest;
import com.knowledgehub.dto.response.ApiResponse;
import com.knowledgehub.dto.response.NoteResponse;
import com.knowledgehub.service.NoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NoteResponse>>> getNotes(
            @RequestParam(required = false) String filter,
            @RequestParam(required = false) String tag) {
        return ResponseEntity.ok(ApiResponse.success(noteService.getNotes(filter, tag)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<NoteResponse>> createNote(@Valid @RequestBody NoteRequest request) {
        NoteResponse note = noteService.createNote(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Note created", note));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<NoteResponse>> getNote(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(noteService.getNoteById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<NoteResponse>> updateNote(
            @PathVariable Long id,
            @Valid @RequestBody NoteRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Note updated", noteService.updateNote(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable Long id) {
        noteService.softDeleteNote(id);
        return ResponseEntity.ok(ApiResponse.success("Note moved to trash", null));
    }

    @PatchMapping("/{id}/pin")
    public ResponseEntity<ApiResponse<NoteResponse>> togglePin(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(noteService.togglePin(id)));
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<ApiResponse<NoteResponse>> toggleArchive(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(noteService.toggleArchive(id)));
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<NoteResponse>> restoreNote(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Note restored", noteService.restoreNote(id)));
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<ApiResponse<Void>> permanentDelete(@PathVariable Long id) {
        noteService.permanentDeleteNote(id);
        return ResponseEntity.ok(ApiResponse.success("Note permanently deleted", null));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<NoteResponse>>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String tag) {
        return ResponseEntity.ok(ApiResponse.success(noteService.searchNotes(q, tag)));
    }
}
