package com.knowledgehub.controller;

import com.knowledgehub.dto.response.ApiResponse;
import com.knowledgehub.dto.response.NoteResponse;
import com.knowledgehub.dto.response.LinkResponse;
import com.knowledgehub.service.NoteService;
import com.knowledgehub.service.LinkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Allows users to export all their data as JSON.
 * This builds trust — users know they can always leave with their data.
 */
@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private final NoteService noteService;
    private final LinkService linkService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> exportAll() {
        List<NoteResponse> notes = noteService.getNotes(null, null);
        List<NoteResponse> archived = noteService.getNotes("archived", null);
        List<LinkResponse> links = linkService.getLinks();

        Map<String, Object> export = new LinkedHashMap<>();
        export.put("exportedAt", Instant.now().toString());
        export.put("version", "1.0.0");
        export.put("notes", notes);
        export.put("archivedNotes", archived);
        export.put("links", links);
        export.put("totalNotes", notes.size() + archived.size());
        export.put("totalLinks", links.size());

        return ResponseEntity.ok(ApiResponse.success(export));
    }
}
