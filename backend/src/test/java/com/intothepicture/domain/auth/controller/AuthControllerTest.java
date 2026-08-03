package com.intothepicture.domain.auth.controller;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.hamcrest.Matchers.containsString;

import com.intothepicture.domain.auth.dto.AuthDtos.AuthResponse;
import com.intothepicture.domain.auth.dto.AuthDtos.UserProfile;
import com.intothepicture.domain.auth.service.AuthService;
import com.intothepicture.domain.user.entity.Role;
import com.intothepicture.global.security.JwtService.JwtPrincipal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import jakarta.servlet.http.Cookie;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

@WebMvcTest(controllers = AuthController.class, excludeAutoConfiguration = SecurityAutoConfiguration.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {
    @Autowired MockMvc mockMvc;
    @MockBean AuthService authService;

    @Test
    void kakaoLogin_returnsContractShape() throws Exception {
        given(authService.loginWithKakao("authorization-code", "http://localhost:5173/login")).willReturn(response());
        mockMvc.perform(post("/api/v1/auth/kakao").contentType("application/json")
                .content("{\"authorizationCode\":\"authorization-code\",\"redirectUri\":\"http://localhost:5173/login\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").value("access"))
            .andExpect(jsonPath("$.tokenType").value("Bearer"))
            .andExpect(jsonPath("$.expiresIn").value(900))
            .andExpect(jsonPath("$.refreshToken").doesNotExist())
            .andExpect(header().string("Set-Cookie", containsString("itp_refresh=refresh")))
            .andExpect(header().string("Set-Cookie", containsString("HttpOnly")))
            .andExpect(jsonPath("$.user.id").value(7))
            .andExpect(jsonPath("$.user.nickname").value("tester"));
    }

    @Test
    void refresh_returnsSameAuthContractShape() throws Exception {
        given(authService.refresh("old-refresh")).willReturn(response());
        mockMvc.perform(post("/api/v1/auth/refresh").cookie(new Cookie("itp_refresh", "old-refresh")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.tokenType").value("Bearer"))
            .andExpect(jsonPath("$.refreshToken").doesNotExist())
            .andExpect(jsonPath("$.user.email").value("tester@example.com"));
    }

    @Test
    void blankAuthorizationCode_returnsCommon400Shape() throws Exception {
        mockMvc.perform(post("/api/v1/auth/kakao").contentType("application/json")
                .content("{\"authorizationCode\":\"\",\"redirectUri\":\"http://localhost:5173/login\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("INVALID_REQUEST"))
            .andExpect(jsonPath("$.error.message").exists());
    }

    @Test
    void logout_returns204() throws Exception {
        var principal = new JwtPrincipal(7L, Role.USER, java.time.Instant.now().plusSeconds(60));
        var auth = new UsernamePasswordAuthenticationToken(principal, null, java.util.List.of());
        RequestPostProcessor requestPrincipal = request -> { request.setUserPrincipal(auth); return request; };
        mockMvc.perform(post("/api/v1/auth/logout").with(requestPrincipal))
            .andExpect(status().isNoContent());
    }

    private AuthResponse response() {
        return new AuthResponse("access", "refresh", "Bearer", 900,
            new UserProfile(7L, "tester", "https://image", "tester@example.com"));
    }
}
