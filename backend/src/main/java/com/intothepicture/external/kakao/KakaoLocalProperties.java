package com.intothepicture.external.kakao;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 카카오 로컬 검색 설정. restKey 는 .env 의 KAKAO_REST_KEY(하드코딩 금지).
 * Authorization 헤더 형식: {@code KakaoAK {restKey}}.
 */
@ConfigurationProperties(prefix = "external.kakao")
public record KakaoLocalProperties(String baseUrl, String restKey) {

    public KakaoLocalProperties {
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "https://dapi.kakao.com";
        }
    }

    public boolean hasRestKey() {
        return restKey != null && !restKey.isBlank();
    }
}
