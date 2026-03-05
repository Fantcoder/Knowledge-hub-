package com.knowledgehub.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Simple in-memory rate limiter.
 * Production alternative: use Redis + Spring Cloud Gateway or Bucket4j.
 * Limits: 60 requests per minute per IP for general endpoints,
 * 10 requests per minute per IP for auth endpoints.
 */
@Component
@Order(1)
public class RateLimitFilter implements Filter {

    private final Map<String, TokenBucket> buckets = new ConcurrentHashMap<>();

    // Cleanup stale entries every 5 minutes
    private long lastCleanup = System.currentTimeMillis();
    private static final long CLEANUP_INTERVAL = 5 * 60 * 1000;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        // Skip rate limiting for CORS preflight OPTIONS requests
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        String ip = getClientIP(req);
        String path = req.getRequestURI();

        // Determine rate limit based on endpoint
        int maxRequests = path.startsWith("/api/auth/") ? 10 : 60;
        String key = ip + ":" + (path.startsWith("/api/auth/") ? "auth" : "api");

        // Periodic cleanup
        long now = System.currentTimeMillis();
        if (now - lastCleanup > CLEANUP_INTERVAL) {
            lastCleanup = now;
            buckets.entrySet().removeIf(e -> now - e.getValue().lastRefill > 120_000);
        }

        TokenBucket bucket = buckets.computeIfAbsent(key, k -> new TokenBucket(maxRequests));

        if (bucket.tryConsume()) {
            res.setHeader("X-RateLimit-Remaining", String.valueOf(bucket.getRemaining()));
            chain.doFilter(request, response);
        } else {
            res.setStatus(429);
            res.setContentType("application/json");
            res.getWriter()
                    .write("{\"success\":false,\"error\":\"Too many requests. Please slow down.\",\"status\":429}");
        }
    }

    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Simple token bucket: refills to max every 60 seconds.
     */
    private static class TokenBucket {
        private final int maxTokens;
        private final AtomicInteger tokens;
        volatile long lastRefill;

        TokenBucket(int maxTokens) {
            this.maxTokens = maxTokens;
            this.tokens = new AtomicInteger(maxTokens);
            this.lastRefill = System.currentTimeMillis();
        }

        boolean tryConsume() {
            refillIfNeeded();
            return tokens.getAndUpdate(t -> t > 0 ? t - 1 : 0) > 0;
        }

        int getRemaining() {
            refillIfNeeded();
            return tokens.get();
        }

        private void refillIfNeeded() {
            long now = System.currentTimeMillis();
            if (now - lastRefill > 60_000) {
                tokens.set(maxTokens);
                lastRefill = now;
            }
        }
    }
}
