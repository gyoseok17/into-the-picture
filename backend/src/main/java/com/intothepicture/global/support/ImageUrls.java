package com.intothepicture.global.support;

/** 외부 이미지 URL 정규화. data.go.kr 이미지가 http 라 혼합콘텐츠 차단 방지 위해 https 치환(docs/06 X4). */
public final class ImageUrls {

    private static final String HTTP = "http://";
    private static final String HTTPS = "https://";

    private ImageUrls() {
    }

    public static String toHttps(String url) {
        if (url == null || url.isBlank()) {
            return url;
        }
        if (url.startsWith(HTTP)) {
            return HTTPS + url.substring(HTTP.length());
        }
        return url;
    }
}
