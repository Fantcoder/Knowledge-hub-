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
public class LinkResponse {
    private Long id;
    private String url;
    private String title;
    private String description;
    private String faviconUrl;
    private LocalDateTime createdAt;
    private Long noteId;
}
