package com.intothepicture.global.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import com.intothepicture.domain.auth.controller.AuthController;
import com.intothepicture.domain.auth.dto.AuthDtos.AuthResponse;
import com.intothepicture.domain.auth.dto.AuthDtos.UserProfile;
import com.intothepicture.domain.auth.service.AuthService;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

/** SecurityFilterChain boundary contract: login/refresh are public; logout and user paths require a bearer token. */
@WebMvcTest(controllers = AuthController.class)
@Import(SecurityConfig.class)
class SecurityConfigTest {
    @Autowired MockMvc mockMvc;
    @MockBean AuthService authService;

    @Test
    void authEndpoints_arePublic() throws Exception {
        given(authService.loginWithKakao("code", "http://localhost:5173/login")).willReturn(new AuthResponse("a", "r", "Bearer", 900,
            new UserProfile(1L, "tester", null, null)));
        mockMvc.perform(post("/api/v1/auth/kakao").contentType("application/json")
                .content("{\"authorizationCode\":\"code\",\"redirectUri\":\"http://localhost:5173/login\"}"))
            .andExpect(status().isOk());
    }

    @Test
    void usersMe_requiresAuthenticationWithCommon401Shape() throws Exception {
        mockMvc.perform(get("/api/v1/users/me"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"))
            .andExpect(jsonPath("$.error.message").exists());
    }

    @Test
    void logout_requiresAuthenticationWithCommon401Shape() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }

    @Test
    void meNamespace_requiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/me/probe"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }
}
