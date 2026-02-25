package com.knowledgehub.controller;

import com.knowledgehub.dto.request.LinkRequest;
import com.knowledgehub.dto.response.ApiResponse;
import com.knowledgehub.dto.response.LinkResponse;
import com.knowledgehub.service.LinkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/links")
@RequiredArgsConstructor
public class LinkController {

    private final LinkService linkService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<LinkResponse>>> getLinks() {
        return ResponseEntity.ok(ApiResponse.success(linkService.getLinks()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LinkResponse>> createLink(@Valid @RequestBody LinkRequest request) {
        LinkResponse link = linkService.createLink(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Link saved", link));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<LinkResponse>> updateLink(
            @PathVariable Long id,
            @Valid @RequestBody LinkRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Link updated", linkService.updateLink(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteLink(@PathVariable Long id) {
        linkService.deleteLink(id);
        return ResponseEntity.ok(ApiResponse.success("Link deleted", null));
    }
}
