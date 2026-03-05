package com.knowledgehub.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SemanticSearchResult {

    private Long noteId;
    private String title;
    private String contentPreview;
    private double similarity;
    private List<String> tags;
}
