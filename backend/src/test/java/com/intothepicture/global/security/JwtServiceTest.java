package com.intothepicture.global.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.intothepicture.domain.user.entity.Role;
import com.intothepicture.global.exception.BusinessException;
import org.junit.jupiter.api.Test;

class JwtServiceTest {
    private final JwtService jwtService = new JwtService(new JwtProperties(
        "test-only-jwt-secret-must-be-at-least-32-bytes-long", 3600, 1209600));

    @Test
    void accessToken_hasUserAndRole() {
        var principal = jwtService.parseAccessToken(jwtService.createAccessToken(10L, Role.USER));
        assertThat(principal.userId()).isEqualTo(10L);
        assertThat(principal.role()).isEqualTo(Role.USER);
    }

    @Test
    void refreshToken_cannotAuthenticateAccessRequest() {
        String refresh = jwtService.createRefreshToken(10L, Role.USER);
        assertThatThrownBy(() -> jwtService.parseAccessToken(refresh)).isInstanceOf(BusinessException.class);
    }
}
