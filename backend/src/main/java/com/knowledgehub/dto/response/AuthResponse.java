package com.knowledgehub.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String accessToken;

    // Carries the refresh token internally from service → controller.
    // @JsonIgnore ensures it is NEVER serialized into the HTTP response body.
    // The controller reads this value and places it in an httpOnly cookie instead.
    @JsonIgnore
    private String refreshTokenValue;

    private String tokenType;
    private Long userId;
    private String username;
    private String email;
}
