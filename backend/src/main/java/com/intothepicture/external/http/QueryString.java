package com.intothepicture.external.http;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 외부 API 용 URI 빌더. 각 파라미터 값을 한 번만 URL-encode 하여 {@link URI} 로 만든다.
 *
 * <p>data.go.kr serviceKey 는 .env 에 <b>decoded</b>(예 {@code ...Q==}) 로 보관되므로
 * 여기서 정확히 한 번 인코딩(→ {@code ...Q%3D%3D})해야 한다. 완성된 URI 를 RestClient 에
 * 그대로 넘기면(문자열이 아닌 URI) 재인코딩(이중 인코딩)되지 않는다 — 검증된 파이썬 호출과 동일.
 */
public final class QueryString {

    private QueryString() {
    }

    /** {@code baseUrl + "?" + 인코딩된 query} 로 URI 생성. params 의 null 값은 제외. */
    public static URI toUri(String baseUrl, Map<String, ?> params) {
        String query = params.entrySet().stream()
            .filter(e -> e.getValue() != null)
            .map(e -> encode(e.getKey()) + "=" + encode(String.valueOf(e.getValue())))
            .collect(Collectors.joining("&"));
        return URI.create(baseUrl + "?" + query);
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
