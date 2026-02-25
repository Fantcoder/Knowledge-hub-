package com.knowledgehub.controller;

import com.knowledgehub.dto.response.ApiResponse;
import com.knowledgehub.dto.response.FileResponse;
import com.knowledgehub.entity.FileEntity;
import com.knowledgehub.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

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
    public ResponseEntity<ApiResponse<List<FileResponse>>> getFiles() {
        return ResponseEntity.ok(ApiResponse.success(fileStorageService.getUserFiles()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFile(@PathVariable Long id) throws IOException {
        fileStorageService.deleteFile(id);
        return ResponseEntity.ok(ApiResponse.success("File deleted", null));
    }
}
