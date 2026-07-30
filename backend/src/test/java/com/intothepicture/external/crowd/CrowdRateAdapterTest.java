package com.intothepicture.external.crowd;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.intothepicture.domain.crowd.port.CrowdForecast;
import com.intothepicture.domain.crowd.port.CrowdQuery;
import com.intothepicture.domain.crowd.port.MatchType;
import com.intothepicture.global.exception.ErrorCode;
import com.intothepicture.global.exception.ExternalApiException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CrowdRateAdapterTest {

    private static final SigunguCode HAPCHEON = new SigunguCode("48", "경상남도", "48890", "합천군");
    private static final LocalDate D1 = LocalDate.of(2026, 6, 28);
    private static final LocalDate D2 = LocalDate.of(2026, 6, 29);

    @Mock
    private SigunguCodeTable sigunguCodeTable;

    @Mock
    private CrowdApiClient crowdApiClient;

    private CrowdRateAdapter adapter() {
        return new CrowdRateAdapter(sigunguCodeTable, crowdApiClient);
    }

    private CrowdQuery query(String place) {
        return new CrowdQuery("48", "합천군", place);
    }

    @Test
    @DisplayName("코드 해석 → 조회 → 관광지 부분일치 → 일별 집중률(날짜 오름차순)")
    void buildsForecast() {
        when(sigunguCodeTable.resolve("48", "합천군")).thenReturn(Optional.of(HAPCHEON));
        when(crowdApiClient.fetch("48", "48890")).thenReturn(List.of(
            new CrowdRow(D2, 80.0, "가야산국립공원(홍류동,청량동지구)", "경상남도", "합천군"),
            new CrowdRow(D1, 50.0, "가야산국립공원(홍류동,청량동지구)", "경상남도", "합천군"),
            new CrowdRow(D1, 30.0, "해인사", "경상남도", "합천군")));

        Optional<CrowdForecast> result = adapter().getForecast(query("가야산국립공원"));

        assertThat(result).isPresent();
        CrowdForecast forecast = result.get();
        assertThat(forecast.attractionName()).isEqualTo("가야산국립공원(홍류동,청량동지구)");
        assertThat(forecast.areaNm()).isEqualTo("경상남도");
        assertThat(forecast.sigunguNm()).isEqualTo("합천군");
        assertThat(forecast.matchType()).isEqualTo(MatchType.PARTIAL);
        assertThat(forecast.daily()).extracting(d -> d.date()).containsExactly(D1, D2); // 정렬됨
        assertThat(forecast.daily()).extracting(d -> d.rate()).containsExactly(50.0, 80.0);
    }

    @Test
    @DisplayName("시군구 코드 해석 실패 → empty(조회 안 함)")
    void unresolvedCode() {
        when(sigunguCodeTable.resolve(anyString(), anyString())).thenReturn(Optional.empty());

        assertThat(adapter().getForecast(query("가야산국립공원"))).isEmpty();
        verify(crowdApiClient, never()).fetch(any(), any());
    }

    @Test
    @DisplayName("관광지 데이터가 비면 empty")
    void emptyRows() {
        when(sigunguCodeTable.resolve("48", "합천군")).thenReturn(Optional.of(HAPCHEON));
        when(crowdApiClient.fetch("48", "48890")).thenReturn(List.of());

        assertThat(adapter().getForecast(query("가야산국립공원"))).isEmpty();
    }

    @Test
    @DisplayName("관광지명 부분일치 실패 → empty(graceful)")
    void noAttractionMatch() {
        when(sigunguCodeTable.resolve("48", "합천군")).thenReturn(Optional.of(HAPCHEON));
        when(crowdApiClient.fetch("48", "48890")).thenReturn(List.of(
            new CrowdRow(D1, 30.0, "해인사", "경상남도", "합천군")));

        assertThat(adapter().getForecast(query("가야산국립공원"))).isEmpty();
    }

    @Test
    @DisplayName("외부 오류(쿼터/장애)는 삼켜서 empty → 상위 204")
    void swallowsExternalError() {
        when(sigunguCodeTable.resolve("48", "합천군")).thenReturn(Optional.of(HAPCHEON));
        when(crowdApiClient.fetch("48", "48890"))
            .thenThrow(new ExternalApiException(ErrorCode.EXTERNAL_ERROR, "장애"));

        assertThat(adapter().getForecast(query("가야산국립공원"))).isEmpty();
    }
}
