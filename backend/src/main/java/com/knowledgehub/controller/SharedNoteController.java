package com.knowledgehub.controller;

import com.knowledgehub.dto.response.ApiResponse;
import com.knowledgehub.dto.response.SharedNoteResponse;
import com.knowledgehub.service.NoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shared")
@RequiredArgsConstructor
public class SharedNoteController {

    private final NoteService noteService;

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<SharedNoteResponse>> getSharedNote(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.success(noteService.getSharedNote(slug)));
    }
}
