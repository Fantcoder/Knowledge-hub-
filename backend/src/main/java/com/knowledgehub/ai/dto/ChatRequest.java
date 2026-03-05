package com.knowledgehub.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {

    @NotBlank(message = "Question is required")
    @Size(max = 2000, message = "Question must be under 2000 characters")
    private String question;

    // Optional: specific note IDs to use as context
    private List<Long> contextNoteIds;
}
