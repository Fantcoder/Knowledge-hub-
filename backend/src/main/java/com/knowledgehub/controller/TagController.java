package com.knowledgehub.controller;

import com.knowledgehub.dto.response.ApiResponse;
import com.knowledgehub.dto.response.TagResponse;
import com.knowledgehub.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TagResponse>>> getTags() {
        return ResponseEntity.ok(ApiResponse.success(tagService.getTags()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TagResponse>> createTag(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Tag name is required", 400));
        }
        TagResponse tag = tagService.createTag(name);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tag created", tag));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTag(@PathVariable Long id) {
        tagService.deleteTag(id);
        return ResponseEntity.ok(ApiResponse.success("Tag deleted", null));
    }
}
