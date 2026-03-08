package com.knowledgehub.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class GraphResponse {
    private List<GraphNode> nodes;
    private List<GraphLink> links;

    @Data
    @Builder
    public static class GraphNode {
        private String id;
        private String name;
        private String group;
        private Integer val;
    }

    @Data
    @Builder
    public static class GraphLink {
        private String source;
        private String target;
    }
}
