package com.knowledgehub.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LinkRequest {

    @NotBlank(message = "URL is required")
    private String url;

    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    private String description;

    private String faviconUrl;

    private Long noteId;
}
