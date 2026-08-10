package com.knowledgehub.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class AuthRateLimiter {

    // 10 attempts per minute per IP
    private static final int MAX_ATTEMPTS = 10;
    private final Cache<String, Integer> requestCounts;

    public AuthRateLimiter() {
        requestCounts = Caffeine.newBuilder()
                .expireAfterWrite(1, TimeUnit.MINUTES)
                .build();
    }

    public boolean isAllowed(HttpServletRequest request) {
        String ip = getClientIp(request);
        Integer count = requestCounts.get(ip, k -> 0);
        if (count >= MAX_ATTEMPTS) {
            return false;
        }
        requestCounts.put(ip, count + 1);
        return true;
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || "unknown".equalsIgnoreCase(xfHeader)) {
            return request.getRemoteAddr();
        }
        // Take the LAST IP — set by our trusted proxy (Render/Nginx), not the client.
        // Taking [0] (the first) is unsafe: attackers can inject any value there.
        String[] parts = xfHeader.split(",");
        return parts[parts.length - 1].trim();
    }
}
