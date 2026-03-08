package com.knowledgehub.controller;

import com.knowledgehub.dto.response.ApiResponse;
import com.knowledgehub.dto.response.GraphResponse;
import com.knowledgehub.entity.User;
import com.knowledgehub.service.GraphService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.knowledgehub.repository.UserRepository;

@RestController
@RequestMapping("/api/graph")
@RequiredArgsConstructor
public class GraphController {

    private final GraphService graphService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<GraphResponse>> getGraph(
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(ApiResponse.success(graphService.generateGraph(user)));
    }
}
