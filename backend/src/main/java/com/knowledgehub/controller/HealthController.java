package com.knowledgehub.controller;

import com.knowledgehub.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    private static final Instant START_TIME = Instant.now();

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> health() {
        Map<String, Object> data = Map.of(
                "status", "UP",
                "uptime", java.time.Duration.between(START_TIME, Instant.now()).toSeconds() + "s",
                "version", "1.0.0");
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
