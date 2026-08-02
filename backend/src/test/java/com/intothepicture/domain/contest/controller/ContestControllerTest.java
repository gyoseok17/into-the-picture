package com.intothepicture.domain.contest.controller;

import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.intothepicture.domain.contest.dto.ContestDetailDto;
import com.intothepicture.domain.contest.dto.ContestMapPinDto;
import com.intothepicture.domain.contest.dto.ContestSummaryDto;
import com.intothepicture.domain.contest.dto.CrowdForecastDto;
import com.intothepicture.domain.contest.service.ContestService;
import com.intothepicture.global.exception.BusinessException;
import com.intothepicture.global.exception.ErrorCode;
import com.intothepicture.global.response.PageResponse;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Pageable;
import org.springframework.test.web.servlet.MockMvc;

/** contest 엔드포인트의 실제 JSON 응답 shape 고정(QA 경계검증 보조). 보안 필터는 비활성. */
@WebMvcTest(controllers = ContestController.class, excludeAutoConfiguration = SecurityAutoConfiguration.class)
@AutoConfigureMockMvc(addFilters = false)
class ContestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ContestService contestService;

    @Test
    void getContests_returnsPageShape() throws Exception {
        ContestSummaryDto summary = new ContestSummaryDto(
            12L, "가야산 설경", "https://x/thumb.jpg", "경상남도 합천군, 가야산국립공원",
            "경상남도", "합천군", "서정철", "202401", "스마트폰 부문", "입선", "겨울",
            List.of("가야산 설경", "겨울"));
        given(contestService.getContests(any(), any(Pageable.class)))
            .willReturn(new PageResponse<>(List.of(summary), new PageResponse.PageMeta(1, 20, 1, false)));

        mockMvc.perform(get("/api/v1/contests").param("season", "겨울"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].id").value(12))
            .andExpect(jsonPath("$.content[0].thumbUrl").value("https://x/thumb.jpg"))
            .andExpect(jsonPath("$.content[0].season").value("겨울"))
            .andExpect(jsonPath("$.content[0].keywords[0]").value("가야산 설경"))
            .andExpect(jsonPath("$.page.page").value(1))
            .andExpect(jsonPath("$.page.size").value(20))
            .andExpect(jsonPath("$.page.totalCount").value(1))
            .andExpect(jsonPath("$.page.hasNext").value(false));
    }

    @Test
    void getContests_keepsParsedFieldsNull_whenUnparsed() throws Exception {
        // season·sido·sigungu 는 파싱 실패 시 빈문자열이 아니라 null 로 직렬화돼야 함(계약·api-shapes 회귀 고정).
        ContestSummaryDto summary = new ContestSummaryDto(
            13L, "무제", "https://x/t.jpg", "어딘가",
            null, null, "촬영자", "202312", "디지털카메라 부문", "입선", null,
            List.of());
        given(contestService.getContests(any(), any(Pageable.class)))
            .willReturn(new PageResponse<>(List.of(summary), new PageResponse.PageMeta(1, 20, 1, false)));

        mockMvc.perform(get("/api/v1/contests"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].season", nullValue()))
            .andExpect(jsonPath("$.content[0].sido", nullValue()))
            .andExpect(jsonPath("$.content[0].sigungu", nullValue()));
    }

    @Test
    void getContestMapPins_returnsArrayShape() throws Exception {
        ContestMapPinDto pin = new ContestMapPinDto(
            12L, "가야산 설경", "https://x/thumb.jpg", 35.8043935, 128.1083354, "입선", "경상남도");
        given(contestService.findMapPins(any())).willReturn(List.of(pin));

        mockMvc.perform(get("/api/v1/contests/map").param("season", "겨울"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$[0].id").value(12))
            .andExpect(jsonPath("$[0].thumbUrl").value("https://x/thumb.jpg"))
            .andExpect(jsonPath("$[0].lat").value(35.8043935))
            .andExpect(jsonPath("$[0].lng").value(128.1083354))
            .andExpect(jsonPath("$[0].awardGrade").value("입선"))
            .andExpect(jsonPath("$[0].sido").value("경상남도"));
    }

    @Test
    void getContestMapPins_returnsEmptyArray_whenNoData() throws Exception {
        given(contestService.findMapPins(any())).willReturn(List.of());

        mockMvc.perform(get("/api/v1/contests/map"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void getContest_returnsDetailShape() throws Exception {
        ContestDetailDto detail = new ContestDetailDto(
            12L, "가야산 설경", "https://x/thumb.jpg", "경상남도 합천군, 가야산국립공원",
            "경상남도", "합천군", "서정철", "202401", "스마트폰 부문", "입선", "겨울",
            List.of("겨울"), "https://x/org.jpg", 35.8043935, 128.1083354, "Type1", true);
        given(contestService.getContest(12L)).willReturn(detail);

        mockMvc.perform(get("/api/v1/contests/12"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.imageUrl").value("https://x/org.jpg"))
            .andExpect(jsonPath("$.lat").value(35.8043935))
            .andExpect(jsonPath("$.lng").value(128.1083354))
            .andExpect(jsonPath("$.copyright").value("Type1"))
            .andExpect(jsonPath("$.crowdAvailable").value(true));
    }

    @Test
    void getCrowd_returns204_whenNoMatch() throws Exception {
        given(contestService.getCrowd(anyLong())).willReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/contests/12/crowd"))
            .andExpect(status().isNoContent());
    }

    @Test
    void getCrowd_returnsForecastShape_whenMatched() throws Exception {
        CrowdForecastDto dto = new CrowdForecastDto(
            "가야산국립공원(홍류동,청량동지구)", "경상남도", "합천군", "PARTIAL",
            List.of(new CrowdForecastDto.DailyRateDto("2026-06-26", 35.25)),
            List.of("2026-06-26"));
        given(contestService.getCrowd(12L)).willReturn(Optional.of(dto));

        mockMvc.perform(get("/api/v1/contests/12/crowd"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.attractionName").value("가야산국립공원(홍류동,청량동지구)"))
            .andExpect(jsonPath("$.matchType").value("PARTIAL"))
            .andExpect(jsonPath("$.daily[0].date").value("2026-06-26"))
            .andExpect(jsonPath("$.daily[0].rate").value(35.25))
            .andExpect(jsonPath("$.recommendedDates[0]").value("2026-06-26"));
    }

    @Test
    void getContest_returns404Shape_whenNotFound() throws Exception {
        given(contestService.getContest(99L)).willThrow(new BusinessException(ErrorCode.NOT_FOUND));

        mockMvc.perform(get("/api/v1/contests/99"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error.code").value("NOT_FOUND"))
            .andExpect(jsonPath("$.error.message").exists());
    }
}
