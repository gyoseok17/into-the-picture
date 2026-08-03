package com.intothepicture.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;

public final class AuthDtos {
    private AuthDtos() {}
    public record KakaoLoginRequest(@NotBlank String authorizationCode, @NotBlank String redirectUri) {}
    public record UserProfile(Long id, String nickname, String profileImageUrl, String email) {}
    public record AuthResponse(String accessToken, String refreshToken, String tokenType, long expiresIn, UserProfile user) {}
    /** Public JSON response. Refresh tokens are delivered only in an HttpOnly cookie. */
    public record SessionResponse(String accessToken, String tokenType, long expiresIn, UserProfile user) {}
}
