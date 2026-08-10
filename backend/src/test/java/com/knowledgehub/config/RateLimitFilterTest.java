package com.knowledgehub.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.PrintWriter;
import java.io.StringWriter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Tests for the XFF IP spoofing fix in RateLimitFilter.
 *
 * Verifies that the general API rate limiter also uses the LAST IP
 * from X-Forwarded-For (proxy-set), not the first (client-controlled).
 */
@DisplayName("RateLimitFilter — IP extraction and rate limit tests")
class RateLimitFilterTest {

    private RateLimitFilter filter;

    @BeforeEach
    void setUp() {
        filter = new RateLimitFilter();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private HttpServletRequest mockRequest(String xff, String remoteAddr, String path) {
        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getHeader("X-Forwarded-For")).thenReturn(xff);
        when(req.getRemoteAddr()).thenReturn(remoteAddr);
        when(req.getRequestURI()).thenReturn(path);
        when(req.getMethod()).thenReturn("POST");
        return req;
    }

    private HttpServletResponse mockResponse() throws Exception {
        HttpServletResponse res = mock(HttpServletResponse.class);
        when(res.getWriter()).thenReturn(new PrintWriter(new StringWriter()));
        return res;
    }

    // ─── XFF IP extraction ────────────────────────────────────────────────────

    @Test
    @DisplayName("No XFF header → uses remoteAddr, request passes through")
    void noXff_passesThrough() throws Exception {
        HttpServletRequest req = mockRequest(null, "10.0.0.1", "/api/notes");
        HttpServletResponse res = mockResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, res, chain);

        verify(chain).doFilter(req, res); // chain was called = request allowed
    }

    @Test
    @DisplayName("SECURITY: attacker rotates first IP in XFF → same bucket used (last IP)")
    void attackerRotatesFirstXffIp_sameRealIpStillCounted() throws Exception {
        FilterChain chain = mock(FilterChain.class);

        // Simulate 61 requests (over the 60 req/min limit).
        // Attacker changes the first IP every request but the LAST IP (real) stays same.
        for (int i = 0; i < 60; i++) {
            HttpServletRequest req = mockRequest(
                    "fake" + i + ".0.0.1, 203.0.113.99", // last IP is always 203.0.113.99
                    "10.0.0.1",
                    "/api/notes"
            );
            HttpServletResponse res = mockResponse();
            filter.doFilter(req, res, chain);
        }

        // 61st request — same real IP should be blocked
        HttpServletRequest req61 = mockRequest("99.99.99.99, 203.0.113.99", "10.0.0.1", "/api/notes");
        HttpServletResponse res61 = mockResponse();

        filter.doFilter(req61, res61, chain);

        // Response should have 429 status
        verify(res61).setStatus(429);
    }

    @Test
    @DisplayName("OPTIONS preflight requests skip rate limiting")
    void optionsPreflight_skipsRateLimit() throws Exception {
        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getMethod()).thenReturn("OPTIONS");
        HttpServletResponse res = mockResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, res, chain);

        // Should pass straight through — no rate limit check
        verify(chain).doFilter(req, res);
        verify(res, never()).setStatus(anyInt());
    }

    @Test
    @DisplayName("Auth endpoints use stricter limit (10) vs API (60)")
    void authEndpoints_useStricterLimit() throws Exception {
        FilterChain chain = mock(FilterChain.class);
        String realIp = "10.0.0.50";

        // Burn 10 auth requests (limit for /api/auth/ = 10)
        for (int i = 0; i < 10; i++) {
            HttpServletRequest req = mockRequest(null, realIp, "/api/auth/login");
            HttpServletResponse res = mockResponse();
            filter.doFilter(req, res, chain);
        }

        // 11th auth request should be blocked
        HttpServletRequest req11 = mockRequest(null, realIp, "/api/auth/login");
        HttpServletResponse res11 = mockResponse();
        filter.doFilter(req11, res11, chain);
        verify(res11).setStatus(429);
    }
}
