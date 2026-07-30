package com.intothepicture.external.tour;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intothepicture.global.exception.ErrorCode;
import com.intothepicture.global.exception.ExternalApiException;
import java.util.ArrayList;
import java.util.List;

/**
 * data.go.kr 공통 응답 래퍼 해석(순수 함수 — HTTP 의존 없음, 단위테스트 대상).
 *
 * <p>정상: {@code response.header.resultCode == "0000"}, 항목은 {@code response.body.items.item[]}.
 * 빈 결과면 {@code items} 가 빈 문자열("")이고 {@code totalCount == 0}(실측). 단건은 {@code item} 이
 * 배열이 아닌 객체로 올 수 있어 둘 다 처리한다.
 *
 * <p>게이트웨이 오류는 {@code OpenApiServiceResponse.cmmMsgHeader.returnReasonCode} 로 오며
 * 22(쿼터 초과) → EXTERNAL_QUOTA, 그 외 → EXTERNAL_ERROR 로 분류한다.
 */
public final class DataGoKrEnvelope {

    private static final String RESULT_OK = "0000";
    private static final String QUOTA_REASON_CODE = "22";

    private DataGoKrEnvelope() {
    }

    /** 응답 JSON 문자열 → 항목 노드 리스트. 오류 래퍼/비정상 resultCode 면 {@link ExternalApiException}. */
    public static List<JsonNode> items(String json, ObjectMapper objectMapper) {
        JsonNode root = readTree(json, objectMapper);
        rejectGatewayError(root, json);

        JsonNode header = root.path("response").path("header");
        if (header.isMissingNode()) {
            throw error("예상치 못한 응답 형식: " + snippet(json));
        }
        String resultCode = header.path("resultCode").asText();
        if (!RESULT_OK.equals(resultCode)) {
            throw error("resultCode=" + resultCode + " " + header.path("resultMsg").asText());
        }
        return collectItems(root.path("response").path("body").path("items").path("item"));
    }

    private static List<JsonNode> collectItems(JsonNode item) {
        List<JsonNode> result = new ArrayList<>();
        if (item.isArray()) {
            item.forEach(result::add);
        } else if (item.isObject()) {
            result.add(item); // 단건 응답은 객체로 옴
        }
        // 빈 결과: items=="" → item 은 MissingNode → 빈 리스트
        return result;
    }

    private static void rejectGatewayError(JsonNode root, String json) {
        JsonNode header = root.path("OpenApiServiceResponse").path("cmmMsgHeader");
        if (header.isMissingNode()) {
            header = root.path("cmmMsgHeader");
        }
        if (!header.isMissingNode()) {
            String reason = header.path("returnReasonCode").asText();
            String msg = header.path("returnAuthMsg").asText() + " " + header.path("errMsg").asText();
            if (QUOTA_REASON_CODE.equals(reason)) {
                throw new ExternalApiException(ErrorCode.EXTERNAL_QUOTA, "관광공사 API 쿼터 초과: " + msg.trim());
            }
            throw error("게이트웨이 오류(" + reason + "): " + msg.trim());
        }
    }

    private static JsonNode readTree(String json, ObjectMapper objectMapper) {
        if (json == null || json.isBlank()) {
            throw error("빈 응답");
        }
        try {
            return objectMapper.readTree(json);
        } catch (Exception e) {
            // _type=json 인데 XML 오류가 오는 경우(키 미등록 등) 원문에서 쿼터 마커 탐지
            if (json.contains("LIMITED_NUMBER_OF_SERVICE_REQUESTS")) {
                throw new ExternalApiException(ErrorCode.EXTERNAL_QUOTA, "관광공사 API 쿼터 초과");
            }
            throw error("JSON 파싱 실패: " + snippet(json));
        }
    }

    private static ExternalApiException error(String detail) {
        return new ExternalApiException(ErrorCode.EXTERNAL_ERROR, "관광공사 API 오류: " + detail);
    }

    private static String snippet(String json) {
        String trimmed = json.strip();
        return trimmed.length() > 200 ? trimmed.substring(0, 200) + "…" : trimmed;
    }
}
