package com.intothepicture.global.config;

import java.util.List;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intothepicture.global.exception.ErrorCode;
import com.intothepicture.global.exception.ErrorResponse;
import com.intothepicture.global.security.JwtAuthenticationFilter;
import com.intothepicture.global.security.JwtProperties;
import java.io.IOException;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * M1: contest 등 공개 엔드포인트만 존재 → 전부 permitAll + CORS 화이트리스트 + stateless.
 * M2: JwtAuthenticationFilter 추가 후 /users/me·/me/** 를 authenticated 로 제한(docs/05).
 */
@Configuration
@EnableConfigurationProperties({CorsProperties.class, JwtProperties.class})
public class SecurityConfig {

    private final CorsProperties corsProperties;
    private final ObjectProvider<JwtAuthenticationFilter> jwtAuthenticationFilter;
    private final ObjectMapper objectMapper;

    public SecurityConfig(CorsProperties corsProperties, ObjectProvider<JwtAuthenticationFilter> jwtAuthenticationFilter, ObjectMapper objectMapper) {
        this.corsProperties = corsProperties;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.objectMapper = objectMapper;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex.authenticationEntryPoint((req, res, e) -> writeError(res, ErrorCode.UNAUTHORIZED))
                .accessDeniedHandler((req, res, e) -> writeError(res, ErrorCode.FORBIDDEN)))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/kakao", "/api/v1/auth/refresh").permitAll()
                .requestMatchers("/api/v1/auth/logout").authenticated()
                .requestMatchers("/api/v1/users/me", "/api/v1/me/**").authenticated()
                .anyRequest().permitAll());
        JwtAuthenticationFilter filter = jwtAuthenticationFilter.getIfAvailable();
        if (filter != null) {
            http.addFilterBefore(filter, UsernamePasswordAuthenticationFilter.class);
        }
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(corsProperties.allowedOrigins());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    private void writeError(jakarta.servlet.http.HttpServletResponse response, ErrorCode code) throws IOException {
        response.setStatus(code.getStatus().value());
        response.setContentType("application/json;charset=UTF-8");
        objectMapper.writeValue(response.getOutputStream(), ErrorResponse.of(code, code.getDefaultMessage()));
    }
}
