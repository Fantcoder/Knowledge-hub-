package com.knowledgehub.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.*;

/**
 * Tests for the Content-Security-Policy header added to SecurityHeadersFilter.
 *
 * The vulnerability: without CSP, browsers execute any script injected into the page.
 * The fix: add a CSP header that restricts script sources to known-safe origins.
 */
@DisplayName("SecurityHeadersFilter — security header tests")
class SecurityHeadersFilterTest {

    private SecurityHeadersFilter filter;

    @BeforeEach
    void setUp() {
        filter = new SecurityHeadersFilter();
    }

    @Test
    @DisplayName("SECURITY: Content-Security-Policy header is present on every response")
    void cspHeader_isPresentOnEveryResponse() throws Exception {
        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse res = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, res, chain);

        verify(res).setHeader(eq("Content-Security-Policy"), contains("default-src 'self'"));
    }

    @Test
    @DisplayName("SECURITY: CSP header restricts scripts to self and Google OAuth only")
    void cspHeader_restrictsScriptSrc() throws Exception {
        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse res = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, res, chain);

        verify(res).setHeader(
                eq("Content-Security-Policy"),
                contains("script-src 'self' https://accounts.google.com")
        );
    }

    @Test
    @DisplayName("SECURITY: CSP header restricts connections to self and Groq API")
    void cspHeader_restrictsConnectSrc() throws Exception {
        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse res = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, res, chain);

        verify(res).setHeader(
                eq("Content-Security-Policy"),
                contains("connect-src 'self' https://api.groq.com")
        );
    }

    @Test
    @DisplayName("X-Frame-Options DENY header is set (clickjacking protection)")
    void xFrameOptions_isDeny() throws Exception {
        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse res = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, res, chain);

        verify(res).setHeader("X-Frame-Options", "DENY");
    }

    @Test
    @DisplayName("X-Content-Type-Options nosniff header is set")
    void xContentTypeOptions_isNoSniff() throws Exception {
        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse res = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, res, chain);

        verify(res).setHeader("X-Content-Type-Options", "nosniff");
    }

    @Test
    @DisplayName("HSTS header is set with 1-year max-age")
    void hstsHeader_isSet() throws Exception {
        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse res = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, res, chain);

        verify(res).setHeader(
                eq("Strict-Transport-Security"),
                contains("max-age=31536000")
        );
    }

    @Test
    @DisplayName("Filter chain continues after setting headers")
    void filterChain_continuesAfterHeaders() throws Exception {
        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse res = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, res, chain);

        // Verify chain.doFilter was called — request wasn't blocked
        verify(chain).doFilter(req, res);
    }
}
