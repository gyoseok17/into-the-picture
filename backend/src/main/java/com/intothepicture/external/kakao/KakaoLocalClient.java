package com.intothepicture.external.kakao;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intothepicture.external.http.ExternalHttpClient;
import com.intothepicture.external.http.QueryString;
import com.intothepicture.global.exception.ErrorCode;
import com.intothepicture.global.exception.ExternalApiException;
import java.net.URI;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * 카카오 로컬 검색 클라이언트(키워드 장소검색 / 주소검색). 외부 응답 {@code documents[0]} 의 x(경도)·y(위도)·
 * place_name/address_name 을 내부 {@link KakaoPlace} 로 변환한다. 결과 0건이면 {@link Optional#empty()}.
 */
@Component
public class KakaoLocalClient {

    private static final Logger log = LoggerFactory.getLogger(KakaoLocalClient.class);

    private final ExternalHttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final KakaoLocalProperties properties;

    public KakaoLocalClient(ExternalHttpClient httpClient, ObjectMapper objectMapper, KakaoLocalProperties properties) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
        this.properties = properties;
    }

    /** 키워드 장소 검색(지오코딩 주력). 예: "가야산국립공원" → (위도, 경도). */
    public Optional<KakaoPlace> searchKeyword(String query) {
        return search("keyword", query);
    }

    /** 주소 검색(폴백). 예: "경상남도 합천군" → 시군구 중심 좌표. */
    public Optional<KakaoPlace> searchAddress(String query) {
        return search("address", query);
    }

    private Optional<KakaoPlace> search(String kind, String query) {
        if (query == null || query.isBlank()) {
            return Optional.empty();
        }
        if (!properties.hasRestKey()) {
            throw new ExternalApiException(ErrorCode.EXTERNAL_ERROR, "KAKAO_REST_KEY 미설정 — 카카오 검색 불가");
        }
        URI uri = QueryString.toUri(
            properties.baseUrl() + "/v2/local/search/" + kind + ".json",
            Map.of("query", query, "size", 1));
        String body = httpClient.getString(uri, Map.of("Authorization", "KakaoAK " + properties.restKey()));
        return firstPlace(body);
    }

    private Optional<KakaoPlace> firstPlace(String body) {
        JsonNode first;
        try {
            JsonNode documents = objectMapper.readTree(body).path("documents");
            if (!documents.isArray() || documents.isEmpty()) {
                return Optional.empty();
            }
            first = documents.get(0);
        } catch (Exception e) {
            throw new ExternalApiException(ErrorCode.EXTERNAL_ERROR, "카카오 응답 파싱 실패");
        }
        try {
            double lng = Double.parseDouble(first.path("x").asText());
            double lat = Double.parseDouble(first.path("y").asText());
            String name = first.path("place_name").asText(first.path("address_name").asText(null));
            return Optional.of(new KakaoPlace(name, lat, lng));
        } catch (NumberFormatException e) {
            log.warn("카카오 좌표 파싱 실패: x={} y={}", first.path("x").asText(), first.path("y").asText());
            return Optional.empty();
        }
    }
}
