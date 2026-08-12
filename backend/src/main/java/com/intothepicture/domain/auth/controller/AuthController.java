package com.intothepicture.domain.auth.controller;

import com.intothepicture.domain.auth.dto.AuthDtos.AuthResponse;
import com.intothepicture.domain.auth.dto.AuthDtos.KakaoLoginRequest;
import com.intothepicture.domain.auth.dto.AuthDtos.SessionResponse;
import com.intothepicture.domain.auth.service.AuthService;
import com.intothepicture.global.exception.BusinessException;
import com.intothepicture.global.exception.ErrorCode;
import com.intothepicture.global.security.JwtService.JwtPrincipal;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private static final String REFRESH_COOKIE = "itp_refresh";
    private static final String SESSION_HINT_COOKIE = "itp_session";
    private static final String REFRESH_COOKIE_PATH = "/api/v1/auth";
    private final AuthService authService;
    private final boolean refreshCookieSecure;
    public AuthController(AuthService authService, @Value("${app.auth.refresh-cookie.secure:false}") boolean refreshCookieSecure) {
        this.authService = authService;
        this.refreshCookieSecure = refreshCookieSecure;
    }

    @PostMapping("/kakao")
    public ResponseEntity<SessionResponse> kakao(@Valid @RequestBody KakaoLoginRequest request) {
        return sessionResponse(authService.loginWithKakao(request.authorizationCode(), request.redirectUri()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<SessionResponse> refresh(@CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) return expiredRefreshResponse();
        try {
            return sessionResponse(authService.refresh(refreshToken));
        } catch (BusinessException e) {
            if (e.getErrorCode() == ErrorCode.UNAUTHORIZED) return expiredRefreshResponse();
            throw e;
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal JwtPrincipal principal) {
        authService.logout(principal.userId());
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, expiredRefreshCookie().toString())
            .header(HttpHeaders.SET_COOKIE, expiredSessionHintCookie().toString())
            .header(HttpHeaders.CACHE_CONTROL, "no-store").build();
    }

    private ResponseEntity<SessionResponse> sessionResponse(AuthResponse session) {
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, refreshCookie(session.refreshToken()).toString())
            .header(HttpHeaders.SET_COOKIE, sessionHintCookie().toString())
            .header(HttpHeaders.CACHE_CONTROL, "no-store")
            .body(new SessionResponse(session.accessToken(), session.tokenType(), session.expiresIn(), session.user()));
    }

    private ResponseCookie refreshCookie(String token) {
        return ResponseCookie.from(REFRESH_COOKIE, token).httpOnly(true).secure(refreshCookieSecure)
            .sameSite("Lax").path(REFRESH_COOKIE_PATH).maxAge(14 * 24 * 60 * 60).build();
    }

    private ResponseCookie expiredRefreshCookie() {
        return ResponseCookie.from(REFRESH_COOKIE, "").httpOnly(true).secure(refreshCookieSecure)
            .sameSite("Lax").path(REFRESH_COOKIE_PATH).maxAge(0).build();
    }

    private ResponseCookie sessionHintCookie() {
        return ResponseCookie.from(SESSION_HINT_COOKIE, "1").secure(refreshCookieSecure)
            .sameSite("Lax").path("/").maxAge(14 * 24 * 60 * 60).build();
    }

    private ResponseCookie expiredSessionHintCookie() {
        return ResponseCookie.from(SESSION_HINT_COOKIE, "").secure(refreshCookieSecure)
            .sameSite("Lax").path("/").maxAge(0).build();
    }

    private ResponseEntity<SessionResponse> expiredRefreshResponse() {
        return ResponseEntity.status(401).header(HttpHeaders.SET_COOKIE, expiredRefreshCookie().toString())
            .header(HttpHeaders.SET_COOKIE, expiredSessionHintCookie().toString()).build();
    }
}
