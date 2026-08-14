package com.knowledgehub.controller;

import com.knowledgehub.dto.request.LoginRequest;
import com.knowledgehub.dto.request.RegisterRequest;
import com.knowledgehub.dto.response.ApiResponse;
import com.knowledgehub.dto.response.AuthResponse;
import com.knowledgehub.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.knowledgehub.security.AuthRateLimiter;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthRateLimiter rateLimiter;

    @Value("${app.cookie.secure:true}")
    private boolean cookieSecure;

    // â”€â”€â”€ Register â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        if (!rateLimiter.isAllowed(httpRequest)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(ApiResponse.error("Too many attempts. Please try again later.", 429));
        }
        AuthResponse response = authService.register(request);
        setRefreshTokenCookie(httpResponse, response.getRefreshTokenValue());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful", response));
    }

    // â”€â”€â”€ Login â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        if (!rateLimiter.isAllowed(httpRequest)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(ApiResponse.error("Too many attempts. Please try again later.", 429));
        }
        AuthResponse response = authService.login(request);
        setRefreshTokenCookie(httpResponse, response.getRefreshTokenValue());
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    // â”€â”€â”€ Google OAuth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(
            @Valid @RequestBody com.knowledgehub.dto.request.GoogleLoginRequest request,
            HttpServletResponse httpResponse) {

        AuthResponse response = authService.googleLogin(request);
        setRefreshTokenCookie(httpResponse, response.getRefreshTokenValue());
        return ResponseEntity.ok(ApiResponse.success("Google Login successful", response));
    }

    // â”€â”€â”€ Refresh â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        // Read refresh token from httpOnly cookie â€” NOT from request body.
        String refreshToken = extractRefreshTokenCookie(httpRequest);

        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("No refresh token found. Please log in again.", 401));
        }

        AuthResponse response = authService.refreshToken(refreshToken);
        // Rotate the refresh token cookie on every refresh (token rotation)
        setRefreshTokenCookie(httpResponse, response.getRefreshTokenValue());
        return ResponseEntity.ok(ApiResponse.success("Token refreshed", response));
    }

    // â”€â”€â”€ Logout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletResponse httpResponse) {
        // Clear the httpOnly cookie by setting Max-Age=0
        clearRefreshTokenCookie(httpResponse);
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }

    // â”€â”€â”€ Cookie helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /**
     * Sets the refresh token as an httpOnly, Secure, SameSite=Strict cookie.
     * Path is scoped to /api/auth/refresh so the cookie is ONLY sent to that
     * endpoint â€” not leaked on every API call.
     */
    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        if (refreshToken == null) return;

        // If secure=true (production HTTPS), we MUST use SameSite=None for cross-domain cookies (Vercel -> Render).
        // If secure=false (local HTTP), browsers reject SameSite=None, so we use Lax.
        String sameSite = cookieSecure ? "None" : "Lax";
        
        String cookieValue = String.format(
                "refreshToken=%s; Max-Age=%d; Path=/api/auth; HttpOnly; %sSameSite=%s",
                refreshToken,
                7 * 24 * 60 * 60, // 7 days in seconds
                cookieSecure ? "Secure; " : "",
                sameSite
        );
        response.addHeader("Set-Cookie", cookieValue);
    }

    /**
     * Overwrites the cookie with an expired empty value to delete it.
     */
    private void clearRefreshTokenCookie(HttpServletResponse response) {
        String sameSite = cookieSecure ? "None" : "Lax";
        String cookieValue = String.format(
                "refreshToken=; Max-Age=0; Path=/api/auth; HttpOnly; %sSameSite=%s",
                cookieSecure ? "Secure; " : "",
                sameSite
        );
        response.addHeader("Set-Cookie", cookieValue);
    }

    /**
     * Reads the refreshToken value from the incoming Cookie header.
     */
    private String extractRefreshTokenCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie cookie : cookies) {
            if ("refreshToken".equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}

