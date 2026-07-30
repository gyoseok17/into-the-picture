package com.intothepicture.domain.contest.dto;

import java.util.List;

/**
 * GET /contests/{id}/crowd (매칭 시 200, 없으면 204). date 는 "YYYY-MM-DD" 30일,
 * recommendedDates 는 혼잡도 낮은 추천일(백엔드 계산).
 */
public record CrowdForecastDto(
    String attractionName,
    String areaNm,
    String sigunguNm,
    String matchType,
    List<DailyRateDto> daily,
    List<String> recommendedDates
) {

    public record DailyRateDto(String date, double rate) {
    }
}
