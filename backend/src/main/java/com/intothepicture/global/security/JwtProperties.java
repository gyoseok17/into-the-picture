package com.intothepicture.global.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(String secret, long accessTokenSeconds, long refreshTokenSeconds) {
    public JwtProperties {
        if (accessTokenSeconds <= 0) accessTokenSeconds = 900;
        if (refreshTokenSeconds <= 0) refreshTokenSeconds = 1209600;
    }
}
