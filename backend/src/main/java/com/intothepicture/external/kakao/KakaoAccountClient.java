package com.intothepicture.external.kakao;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intothepicture.global.exception.BusinessException;
import com.intothepicture.global.exception.ErrorCode;
import com.intothepicture.global.config.CorsProperties;
import java.net.URI;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

/** Exchanges an OAuth authorization code and verifies the Kakao account server-to-server. */
@Component
public class KakaoAccountClient {
    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final KakaoLocalProperties properties;
    private final List<String> allowedOrigins;

    public KakaoAccountClient(RestClient.Builder builder, ObjectMapper objectMapper,
                              KakaoLocalProperties properties, CorsProperties corsProperties) {
        this.restClient = builder.build();
        this.objectMapper = objectMapper;
        this.properties = properties;
        this.allowedOrigins = corsProperties.allowedOrigins();
    }

    public KakaoUser exchangeCodeAndVerify(String authorizationCode, String redirectUri) {
        validateRedirectUri(redirectUri);
        if (properties.restKey() == null || properties.restKey().isBlank()) {
            throw new BusinessException(ErrorCode.EXTERNAL_ERROR, "KAKAO_REST_KEY is not configured.");
        }
        try {
            String accessToken = exchangeCode(authorizationCode, redirectUri);
            String body = restClient.get().uri(URI.create("https://kapi.kakao.com/v2/user/me"))
                .header("Authorization", "Bearer " + accessToken).retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> { throw new BusinessException(ErrorCode.EXTERNAL_ERROR, "Kakao account lookup failed."); })
                .body(String.class);
            JsonNode root = objectMapper.readTree(body);
            long id = root.path("id").asLong(0);
            if (id <= 0) throw new BusinessException(ErrorCode.UNAUTHORIZED, "Kakao account response is invalid.");
            JsonNode account = root.path("kakao_account");
            JsonNode profile = account.path("profile");
            String nickname = firstText(
                profile.path("nickname"),
                root.path("properties").path("nickname")
            );
            if (nickname == null) nickname = "카카오 사용자";
            String image = profile.path("profile_image_url").isNull() ? null : profile.path("profile_image_url").asText(null);
            String email = account.path("email").isNull() ? null : account.path("email").asText(null);
            return new KakaoUser(id, nickname, image, email);
        } catch (BusinessException e) { throw e;
        } catch (RestClientResponseException e) { throw new BusinessException(ErrorCode.EXTERNAL_ERROR, "Kakao account lookup failed.");
        } catch (Exception e) { throw new BusinessException(ErrorCode.EXTERNAL_ERROR, "Kakao account verification failed."); }
    }

    private String exchangeCode(String authorizationCode, String redirectUri) {
        try {
            String body = restClient.post().uri(URI.create("https://kauth.kakao.com/oauth/token"))
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(tokenRequestBody(authorizationCode, redirectUri))
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError,
                    (req, res) -> { throw new BusinessException(ErrorCode.UNAUTHORIZED, "Kakao authorization code is invalid."); })
                .onStatus(HttpStatusCode::is5xxServerError,
                    (req, res) -> { throw new BusinessException(ErrorCode.EXTERNAL_ERROR, "Kakao token exchange failed."); })
                .body(String.class);
            String accessToken = objectMapper.readTree(body).path("access_token").asText();
            if (accessToken.isBlank()) throw new BusinessException(ErrorCode.EXTERNAL_ERROR, "Kakao token response is invalid.");
            return accessToken;
        } catch (BusinessException e) { throw e;
        } catch (RestClientResponseException e) { throw new BusinessException(ErrorCode.EXTERNAL_ERROR, "Kakao token exchange failed.");
        } catch (Exception e) { throw new BusinessException(ErrorCode.EXTERNAL_ERROR, "Kakao token exchange failed."); }
    }

    private void validateRedirectUri(String redirectUri) {
        try {
            URI uri = URI.create(redirectUri);
            String origin = uri.getScheme() + "://" + uri.getAuthority();
            if (!uri.isAbsolute() || uri.getUserInfo() != null || uri.getRawQuery() != null || uri.getRawFragment() != null
                || !"/login".equals(uri.getPath()) || !allowedOrigins.contains(origin)) {
                throw new BusinessException(ErrorCode.INVALID_REQUEST, "redirectUri is not an allowed login callback.");
            }
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "redirectUri is not an allowed login callback.");
        }
    }

    private String tokenRequestBody(String authorizationCode, String redirectUri) {
        String body = "grant_type=authorization_code&client_id=" + encode(properties.restKey())
            + "&redirect_uri=" + encode(redirectUri) + "&code=" + encode(authorizationCode);
        return properties.hasClientSecret() ? body + "&client_secret=" + encode(properties.clientSecret()) : body;
    }

    private String encode(String value) {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8);
    }

    private String firstText(JsonNode... candidates) {
        for (JsonNode candidate : candidates) {
            if (candidate != null && !candidate.isMissingNode() && !candidate.isNull()) {
                String value = candidate.asText().trim();
                if (!value.isEmpty()) return value;
            }
        }
        return null;
    }
    public record KakaoUser(long id, String nickname, String profileImageUrl, String email) {}
}
