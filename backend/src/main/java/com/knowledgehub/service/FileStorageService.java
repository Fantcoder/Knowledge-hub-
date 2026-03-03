package com.knowledgehub.service;

import com.knowledgehub.dto.response.FileResponse;
import com.knowledgehub.entity.FileEntity;
import com.knowledgehub.entity.Note;
import com.knowledgehub.entity.User;
import com.knowledgehub.exception.ResourceNotFoundException;
import com.knowledgehub.repository.FileRepository;
import com.knowledgehub.repository.NoteRepository;
import com.knowledgehub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileStorageService {

    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final NoteRepository noteRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/png",
            "image/jpeg",
            "image/webp",
            "text/plain");

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Transactional
    public FileResponse uploadFile(MultipartFile file, Long noteId) throws IOException {
        User user = getCurrentUser();

        // Validate file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum allowed limit of 10MB");
        }

        // Validate MIME type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new IllegalArgumentException(
                    "File type not allowed. Allowed types: PDF, DOCX, PNG, JPG, JPEG, WEBP, TXT");
        }

        // Build storage path: ./uploads/{userId}/{year}/{month}/
        LocalDateTime now = LocalDateTime.now();
        String relativePath = user.getId() + "/" + now.getYear() + "/" + String.format("%02d", now.getMonthValue());
        Path storageDir = Paths.get(uploadDir, relativePath);
        Files.createDirectories(storageDir);

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            originalFilename = "upload";
        }
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex);
        }
        String storedName = UUID.randomUUID() + extension;
        Path targetPath = storageDir.resolve(storedName);

        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        Note note = null;
        if (noteId != null) {
            note = noteRepository.findByIdAndUser(noteId, user)
                    .orElse(null);
        }

        FileEntity fileEntity = FileEntity.builder()
                .originalName(originalFilename)
                .storedName(storedName)
                .fileType(contentType)
                .fileSize(file.getSize())
                .filePath(relativePath + "/" + storedName)
                .note(note)
                .user(user)
                .build();

        FileEntity saved = fileRepository.save(fileEntity);
        log.info("File uploaded: {} by user {}", storedName, user.getUsername());

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Resource downloadFile(Long fileId) throws MalformedURLException {
        User user = getCurrentUser();
        FileEntity fileEntity = fileRepository.findByIdAndUser(fileId, user)
                .orElseThrow(() -> new ResourceNotFoundException("File", fileId));

        Path filePath = Paths.get(uploadDir, fileEntity.getFilePath());
        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            throw new ResourceNotFoundException("File not found on server");
        }

        return resource;
    }

    @Transactional(readOnly = true)
    public FileEntity getFileEntity(Long fileId) {
        User user = getCurrentUser();
        return fileRepository.findByIdAndUser(fileId, user)
                .orElseThrow(() -> new ResourceNotFoundException("File", fileId));
    }

    // Paginated (for API)
    @Transactional(readOnly = true)
    public Page<FileResponse> getUserFilesPaged(Pageable pageable) {
        User user = getCurrentUser();
        return fileRepository.findByUserOrderByUploadDateDesc(user, pageable)
                .map(this::toResponse);
    }

    // Non-paginated (for internal use)
    @Transactional(readOnly = true)
    public List<FileResponse> getUserFiles() {
        User user = getCurrentUser();
        return fileRepository.findByUser(user).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteFile(Long fileId) throws IOException {
        User user = getCurrentUser();
        FileEntity fileEntity = fileRepository.findByIdAndUser(fileId, user)
                .orElseThrow(() -> new ResourceNotFoundException("File", fileId));

        Path filePath = Paths.get(uploadDir, fileEntity.getFilePath());
        Files.deleteIfExists(filePath);
        fileRepository.delete(fileEntity);
        log.info("File deleted: {} by user {}", fileEntity.getStoredName(), user.getUsername());
    }

    private FileResponse toResponse(FileEntity f) {
        return FileResponse.builder()
                .id(f.getId())
                .originalName(f.getOriginalName())
                .fileType(f.getFileType())
                .fileSize(f.getFileSize())
                .downloadUrl("/api/files/" + f.getId() + "/download")
                .uploadDate(f.getUploadDate())
                .noteId(f.getNote() != null ? f.getNote().getId() : null)
                .build();
    }
}
