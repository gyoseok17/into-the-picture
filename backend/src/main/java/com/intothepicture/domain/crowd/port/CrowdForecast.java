package com.intothepicture.domain.crowd.port;

import java.util.List;

/**
 * 매칭된 관광지의 30일 일별 집중률. recommendedDates(추천일)는 도메인이 daily 로 계산하므로
 * provider 는 daily 까지만 반환한다(계약 §3).
 */
public record CrowdForecast(
    String attractionName,
    String areaNm,
    String sigunguNm,
    MatchType matchType,
    List<DailyRate> daily
) {
}
