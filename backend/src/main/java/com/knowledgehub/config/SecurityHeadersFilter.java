package com.knowledgehub.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Adds security headers to every response.
 * These prevent common web attacks in production.
 */
@Component
@Order(2)
public class SecurityHeadersFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletResponse res = (HttpServletResponse) response;

        // Prevent MIME type sniffing
        res.setHeader("X-Content-Type-Options", "nosniff");

        // Prevent clickjacking
        res.setHeader("X-Frame-Options", "DENY");

        // Enable XSS filter in older browsers
        res.setHeader("X-XSS-Protection", "1; mode=block");

        // Strict transport security (only effective over HTTPS)
        res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

        // Prevent referrer leakage
        res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

        // Restrict permissions
        res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

        chain.doFilter(request, response);
    }
}
