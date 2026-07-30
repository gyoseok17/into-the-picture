package com.intothepicture.external.tour;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 한국관광공사(data.go.kr B551011) 공통 설정. serviceKey 는 .env 의 DATA_GO_KR_KEY(decoded).
 * 코드 하드코딩 금지 — 환경변수/프로파일로 주입(docs/06, 스킬 external-api-adapter).
 */
@ConfigurationProperties(prefix = "external.tour")
public record TourApiProperties(String baseUrl, String serviceKey, String mobileOs, String mobileApp) {

    public TourApiProperties {
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "https://apis.data.go.kr/B551011";
        }
        if (mobileOs == null || mobileOs.isBlank()) {
            mobileOs = "ETC";
        }
        if (mobileApp == null || mobileApp.isBlank()) {
            mobileApp = "IntoThePicture";
        }
    }

    public boolean hasServiceKey() {
        return serviceKey != null && !serviceKey.isBlank();
    }
}
