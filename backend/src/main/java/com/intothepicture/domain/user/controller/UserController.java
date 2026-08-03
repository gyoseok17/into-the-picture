package com.intothepicture.domain.user.controller;

import com.intothepicture.domain.auth.dto.AuthDtos.UserProfile;
import com.intothepicture.domain.auth.service.AuthService;
import com.intothepicture.global.security.JwtService.JwtPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
public class UserController {
    private final AuthService authService;
    public UserController(AuthService authService) { this.authService = authService; }
    @GetMapping("/me") public UserProfile me(@AuthenticationPrincipal JwtPrincipal principal) { return authService.me(principal.userId()); }
}
