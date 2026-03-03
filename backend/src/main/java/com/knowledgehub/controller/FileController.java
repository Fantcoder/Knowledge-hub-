package com.knowledgehub.controller;

import com.knowledgehub.dto.response.ApiResponse;
import com.knowledgehub.dto.response.FileResponse;
import com.knowledgehub.entity.FileEntity;
import com.knowledgehub.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<FileResponse>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "noteId", required = false) Long noteId) throws IOException {
        FileResponse response = fileStorageService.uploadFile(file, noteId);
        return ResponseEntity.ok(ApiResponse.success("File uploaded successfully", response));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id) throws IOException {
        FileEntity fileEntity = fileStorageService.getFileEntity(id);
        Resource resource = fileStorageService.downloadFile(id);

        String contentType = fileEntity.getFileType() != null
                ? fileEntity.getFileType()
                : MediaType.APPLICATION_OCTET_STREAM_VALUE;

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + fileEntity.getOriginalName() + "\"")
                .body(resource);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<FileResponse>>> getFiles(
            @PageableDefault(size = 20, sort = "uploadDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(fileStorageService.getUserFilesPaged(pageable)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFile(@PathVariable Long id) throws IOException {
        fileStorageService.deleteFile(id);
        return ResponseEntity.ok(ApiResponse.success("File deleted", null));
    }
}
