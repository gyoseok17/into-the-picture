package com.intothepicture.external.tour;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intothepicture.external.http.ExternalHttpClient;
import com.intothepicture.external.http.QueryString;
import com.intothepicture.global.exception.ErrorCode;
import com.intothepicture.global.exception.ExternalApiException;
import java.net.URI;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

/**
 * 한국관광공사 data.go.kr(B551011) 공통 호출기. 공통 파라미터(serviceKey·MobileOS·MobileApp·_type=json)
 * 부착, 전송은 {@link ExternalHttpClient}, 래퍼 해석은 {@link DataGoKrEnvelope} 에 위임한다.
 *
 * <p>서비스별(공모전·집중률) 필드 매핑은 각 도메인 클라이언트가 담당 — 여기서는 항목 노드까지만 반환.
 */
@Component
public class TourApiClient {

    private final ExternalHttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final TourApiProperties properties;

    public TourApiClient(ExternalHttpClient httpClient, ObjectMapper objectMapper, TourApiProperties properties) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
        this.properties = properties;
    }

    /**
     * {@code operationPath}(예 "PhokoAwrdService/phokoAwrdList") 를 호출해 항목 노드 리스트 반환.
     * serviceKey 미설정이면 호출하지 않고 EXTERNAL_ERROR(설정 누락) 로 알린다.
     */
    public List<JsonNode> fetchItems(String operationPath, Map<String, ?> params) {
        return fetchPage(operationPath, params).items();
    }

    public DataGoKrEnvelope.Page fetchPage(String operationPath, Map<String, ?> params) {
        if (!properties.hasServiceKey()) {
            throw new ExternalApiException(ErrorCode.EXTERNAL_ERROR, "DATA_GO_KR_KEY 미설정 — 관광공사 API 호출 불가");
        }
        URI uri = QueryString.toUri(properties.baseUrl() + "/" + operationPath, commonParams(params));
        String body = httpClient.getString(uri, Map.of());
        return DataGoKrEnvelope.page(body, objectMapper);
    }

    private Map<String, Object> commonParams(Map<String, ?> params) {
        Map<String, Object> merged = new LinkedHashMap<>();
        merged.put("serviceKey", properties.serviceKey());
        merged.put("MobileOS", properties.mobileOs());
        merged.put("MobileApp", properties.mobileApp());
        merged.put("_type", "json");
        merged.putAll(params);
        return merged;
    }
}
