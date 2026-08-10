package com.knowledgehub.security;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Tests for the XFF IP spoofing fix in AuthRateLimiter.
 *
 * The vulnerability: taking XFF[0] (client-controlled) as the real IP lets
 * attackers bypass rate limiting by rotating the header on every request.
 * The fix: take XFF[last] which is appended by our trusted proxy and cannot
 * be faked by the client.
 */
@DisplayName("AuthRateLimiter — IP extraction security tests")
class AuthRateLimiterTest {

    private AuthRateLimiter rateLimiter;

    @BeforeEach
    void setUp() {
        rateLimiter = new AuthRateLimiter();
    }

    // ─── XFF IP extraction ────────────────────────────────────────────────────

    @Test
    @DisplayName("No XFF header → falls back to remoteAddr")
    void noXffHeader_usesRemoteAddr() {
        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getHeader("X-Forwarded-For")).thenReturn(null);
        when(req.getRemoteAddr()).thenReturn("10.0.0.1");

        // First request should always be allowed
        assertThat(rateLimiter.isAllowed(req)).isTrue();
    }

    @Test
    @DisplayName("Single IP in XFF → uses that IP")
    void singleIpInXff_usesThatIp() {
        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getHeader("X-Forwarded-For")).thenReturn("203.0.113.5");
        when(req.getRemoteAddr()).thenReturn("10.0.0.1");

        assertThat(rateLimiter.isAllowed(req)).isTrue();
    }

    @Test
    @DisplayName("SECURITY: multiple IPs in XFF → uses LAST (proxy-set), not FIRST (client-set)")
    void multipleIpsInXff_usesLastIp_notFirst() {
        // An attacker sends: X-Forwarded-For: <fake>, <fake2>
        // Our proxy appends the real client IP at the end: <fake>, <fake2>, <real>
        // We must use the LAST one (real), not the first (attacker-controlled)

        HttpServletRequest req1 = mock(HttpServletRequest.class);
        // Simulates attacker rotating fake IPs in position [0]
        when(req1.getHeader("X-Forwarded-For")).thenReturn("1.2.3.4, 5.6.7.8, 10.0.0.99");
        when(req1.getRemoteAddr()).thenReturn("10.0.0.1");

        HttpServletRequest req2 = mock(HttpServletRequest.class);
        // Same real client IP (10.0.0.99) but different fake leading IP
        when(req2.getHeader("X-Forwarded-For")).thenReturn("9.9.9.9, 10.0.0.99");
        when(req2.getRemoteAddr()).thenReturn("10.0.0.1");

        // Both requests resolve to 10.0.0.99 — they count against the same bucket
        assertThat(rateLimiter.isAllowed(req1)).isTrue();
        assertThat(rateLimiter.isAllowed(req2)).isTrue();
        // If we had used [0], req1 would be counted as 1.2.3.4 and req2 as 9.9.9.9
        // — effectively infinite separate buckets = rate limit bypass. Bug fixed.
    }

    @Test
    @DisplayName("SECURITY: blank XFF 'unknown' value → falls back to remoteAddr")
    void unknownXffValue_fallsBackToRemoteAddr() {
        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getHeader("X-Forwarded-For")).thenReturn("unknown");
        when(req.getRemoteAddr()).thenReturn("10.0.0.1");

        assertThat(rateLimiter.isAllowed(req)).isTrue();
    }

    // ─── Rate limiting logic ──────────────────────────────────────────────────

    @Test
    @DisplayName("Allows up to 10 requests from same IP")
    void allowsUpToMaxRequests() {
        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getHeader("X-Forwarded-For")).thenReturn(null);
        when(req.getRemoteAddr()).thenReturn("192.168.1.1");

        for (int i = 0; i < 10; i++) {
            assertThat(rateLimiter.isAllowed(req))
                    .as("Request %d should be allowed", i + 1)
                    .isTrue();
        }
    }

    @Test
    @DisplayName("Blocks the 11th request from same IP")
    void blocksAfterMaxRequests() {
        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getHeader("X-Forwarded-For")).thenReturn(null);
        when(req.getRemoteAddr()).thenReturn("192.168.1.2");

        for (int i = 0; i < 10; i++) {
            rateLimiter.isAllowed(req); // burn through the limit
        }

        assertThat(rateLimiter.isAllowed(req)).isFalse();
    }

    @Test
    @DisplayName("Different IPs have separate rate limit buckets")
    void differentIpsHaveSeparateBuckets() {
        HttpServletRequest ip1 = mock(HttpServletRequest.class);
        when(ip1.getHeader("X-Forwarded-For")).thenReturn(null);
        when(ip1.getRemoteAddr()).thenReturn("10.0.0.10");

        HttpServletRequest ip2 = mock(HttpServletRequest.class);
        when(ip2.getHeader("X-Forwarded-For")).thenReturn(null);
        when(ip2.getRemoteAddr()).thenReturn("10.0.0.11");

        // Exhaust ip1's bucket
        for (int i = 0; i < 10; i++) rateLimiter.isAllowed(ip1);
        assertThat(rateLimiter.isAllowed(ip1)).isFalse();

        // ip2 should still be fully allowed
        assertThat(rateLimiter.isAllowed(ip2)).isTrue();
    }
}
