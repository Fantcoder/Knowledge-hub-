package com.knowledgehub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileResponse {
    private Long id;
    private String originalName;
    private String fileType;
    private Long fileSize;
    private String downloadUrl;
    private LocalDateTime uploadDate;
    private Long noteId;
}
