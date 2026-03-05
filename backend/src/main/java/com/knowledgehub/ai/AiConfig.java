package com.knowledgehub.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
@EnableAsync
public class AiConfig {

    @Value("${ai.api-key:}")
    private String aiApiKey;

    @Value("${ai.base-url:https://openrouter.ai/api/v1}")
    private String aiBaseUrl;

    @Bean
    public WebClient aiWebClient() {
        return WebClient.builder()
                .baseUrl(aiBaseUrl)
                .defaultHeader("Authorization", "Bearer " + aiApiKey)
                .defaultHeader("Content-Type", "application/json")
                // OpenRouter recommended headers
                .defaultHeader("HTTP-Referer", "https://knowledgehub.app")
                .defaultHeader("X-Title", "KnowledgeHub")
                .codecs(configurer -> configurer
                        .defaultCodecs()
                        .maxInMemorySize(16 * 1024 * 1024))
                .build();
    }

    public boolean isConfigured() {
        return aiApiKey != null && !aiApiKey.isBlank();
    }
}
