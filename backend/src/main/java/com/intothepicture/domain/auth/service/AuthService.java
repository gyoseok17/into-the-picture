package com.intothepicture.domain.auth.service;

import com.intothepicture.domain.auth.dto.AuthDtos.AuthResponse;
import com.intothepicture.domain.auth.dto.AuthDtos.UserProfile;
import com.intothepicture.domain.auth.entity.RefreshToken;
import com.intothepicture.domain.auth.repository.RefreshTokenRepository;
import com.intothepicture.domain.user.entity.Role;
import com.intothepicture.domain.user.entity.User;
import com.intothepicture.domain.user.repository.UserRepository;
import com.intothepicture.external.kakao.KakaoAccountClient;
import com.intothepicture.global.exception.BusinessException;
import com.intothepicture.global.exception.ErrorCode;
import com.intothepicture.global.security.JwtService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final KakaoAccountClient kakaoAccountClient;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    public AuthService(KakaoAccountClient kakaoAccountClient, UserRepository userRepository, RefreshTokenRepository refreshTokenRepository, JwtService jwtService) {
        this.kakaoAccountClient = kakaoAccountClient; this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository; this.jwtService = jwtService;
    }
    @Transactional
    public AuthResponse loginWithKakao(String authorizationCode, String redirectUri) {
        var kakao = kakaoAccountClient.exchangeCodeAndVerify(authorizationCode, redirectUri);
        User user = userRepository.findByKakaoId(kakao.id()).map(existing -> {
            existing.updateKakaoProfile(kakao.nickname(), kakao.profileImageUrl(), kakao.email()); return existing;
        }).orElseGet(() -> userRepository.save(User.builder().kakaoId(kakao.id()).nickname(kakao.nickname())
            .profileImageUrl(kakao.profileImageUrl()).email(kakao.email()).role(Role.USER).build()));
        return issue(user);
    }
    @Transactional
    public AuthResponse refresh(String refreshToken) {
        JwtService.JwtPrincipal principal = jwtService.parseRefreshToken(refreshToken);
        RefreshToken stored = refreshTokenRepository.findByUserId(principal.userId())
            .filter(rt -> rt.getExpiresAt().isAfter(Instant.now()))
            .filter(rt -> MessageDigest.isEqual(rt.getTokenHash().getBytes(StandardCharsets.US_ASCII), hash(refreshToken).getBytes(StandardCharsets.US_ASCII)))
            .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        return issue(stored.getUser());
    }
    @Transactional
    public void logout(Long userId) { refreshTokenRepository.deleteByUserId(userId); }
    @Transactional(readOnly = true)
    public UserProfile me(Long userId) { return userRepository.findById(userId).map(this::profile).orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED)); }
    private AuthResponse issue(User user) {
        String access = jwtService.createAccessToken(user.getId(), user.getRole());
        String refresh = jwtService.createRefreshToken(user.getId(), user.getRole());
        Instant expiry = jwtService.parseRefreshToken(refresh).expiresAt();
        refreshTokenRepository.findByUserId(user.getId()).ifPresentOrElse(
            old -> old.rotate(hash(refresh), expiry),
            () -> refreshTokenRepository.save(new RefreshToken(user, hash(refresh), expiry)));
        return new AuthResponse(access, refresh, "Bearer", jwtService.accessTokenSeconds(), profile(user));
    }
    private UserProfile profile(User user) { return new UserProfile(user.getId(), user.getNickname(), user.getProfileImageUrl(), user.getEmail()); }
    private String hash(String value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (Exception e) { throw new IllegalStateException("SHA-256 unavailable", e); }
    }
}
