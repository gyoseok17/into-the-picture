package com.intothepicture.external.tour;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intothepicture.global.exception.ErrorCode;
import com.intothepicture.global.exception.ExternalApiException;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class DataGoKrEnvelopeTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("정상 응답의 item 배열을 항목 리스트로 반환")
    void parsesItemArray() {
        String json = """
            {"response":{"header":{"resultCode":"0000","resultMsg":"OK"},
             "body":{"items":{"item":[{"contentId":"A"},{"contentId":"B"}]},"numOfRows":2,"totalCount":2}}}""";
        List<JsonNode> items = DataGoKrEnvelope.items(json, objectMapper);
        assertThat(items).hasSize(2);
        assertThat(items.get(0).path("contentId").asText()).isEqualTo("A");
    }

    @Test
    @DisplayName("단건은 item 이 객체로 와도 1건으로 처리")
    void parsesSingleObjectItem() {
        String json = """
            {"response":{"header":{"resultCode":"0000","resultMsg":"OK"},
             "body":{"items":{"item":{"contentId":"A"}},"numOfRows":1,"totalCount":1}}}""";
        assertThat(DataGoKrEnvelope.items(json, objectMapper)).hasSize(1);
    }

    @Test
    @DisplayName("빈 결과(items=\"\")는 빈 리스트(실측 형태)")
    void parsesEmptyItems() {
        String json = """
            {"response":{"header":{"resultCode":"0000","resultMsg":"OK"},
             "body":{"items":"","numOfRows":0,"pageNo":1,"totalCount":0}}}""";
        assertThat(DataGoKrEnvelope.items(json, objectMapper)).isEmpty();
    }

    @Test
    @DisplayName("게이트웨이 쿼터 초과(returnReasonCode 22) → EXTERNAL_QUOTA")
    void mapsQuotaError() {
        String json = """
            {"OpenApiServiceResponse":{"cmmMsgHeader":{
             "errMsg":"SERVICE ERROR","returnAuthMsg":"LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR",
             "returnReasonCode":"22"}}}""";
        assertThatThrownBy(() -> DataGoKrEnvelope.items(json, objectMapper))
            .isInstanceOf(ExternalApiException.class)
            .extracting(e -> ((ExternalApiException) e).getErrorCode())
            .isEqualTo(ErrorCode.EXTERNAL_QUOTA);
    }

    @Test
    @DisplayName("비정상 resultCode → EXTERNAL_ERROR")
    void mapsResultCodeError() {
        String json = """
            {"response":{"header":{"resultCode":"99","resultMsg":"SERVICE ERROR"},"body":{}}}""";
        assertThatThrownBy(() -> DataGoKrEnvelope.items(json, objectMapper))
            .isInstanceOf(ExternalApiException.class)
            .extracting(e -> ((ExternalApiException) e).getErrorCode())
            .isEqualTo(ErrorCode.EXTERNAL_ERROR);
    }
}
