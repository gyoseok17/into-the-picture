package com.intothepicture.global.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** CORS 허용 출처(app.cors.allowed-origins). 미설정 시 로컬 개발 기본값. */
@ConfigurationProperties(prefix = "app.cors")
public record CorsProperties(List<String> allowedOrigins) {

    public CorsProperties {
        if (allowedOrigins == null || allowedOrigins.isEmpty()) {
            allowedOrigins = List.of("http://localhost:5173");
        }
    }
}
