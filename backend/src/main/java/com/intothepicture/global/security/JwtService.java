package com.intothepicture.global.security;

import com.intothepicture.domain.user.entity.Role;
import com.intothepicture.global.exception.BusinessException;
import com.intothepicture.global.exception.ErrorCode;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final JwtProperties properties;
    private final SecretKey key;
    public JwtService(JwtProperties properties) {
        this.properties = properties;
        if (properties.secret() == null || properties.secret().getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT_SECRET must be at least 32 bytes.");
        }
        this.key = Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
    }
    public String createAccessToken(Long userId, Role role) { return create(userId, "access", role); }
    public String createRefreshToken(Long userId, Role role) { return create(userId, "refresh", role); }
    private String create(Long userId, String type, Role role) {
        Instant now = Instant.now(); long seconds = type.equals("access") ? properties.accessTokenSeconds() : properties.refreshTokenSeconds();
        return Jwts.builder().subject(userId.toString()).claim("role", role.name()).claim("tokenType", type)
            .issuedAt(Date.from(now)).expiration(Date.from(now.plusSeconds(seconds))).signWith(key).compact();
    }
    public JwtPrincipal parseAccessToken(String token) { return parse(token, "access"); }
    public JwtPrincipal parseRefreshToken(String token) { return parse(token, "refresh"); }
    private JwtPrincipal parse(String token, String expectedType) {
        try {
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            if (!expectedType.equals(claims.get("tokenType", String.class))) throw new BusinessException(ErrorCode.UNAUTHORIZED);
            return new JwtPrincipal(Long.valueOf(claims.getSubject()), Role.valueOf(claims.get("role", String.class)), claims.getExpiration().toInstant());
        } catch (BusinessException e) { throw e;
        } catch (Exception e) { throw new BusinessException(ErrorCode.UNAUTHORIZED); }
    }
    public long accessTokenSeconds() { return properties.accessTokenSeconds(); }
    public record JwtPrincipal(Long userId, Role role, Instant expiresAt) {}
}
