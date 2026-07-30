package com.intothepicture.domain.crowd.port;

import java.util.Optional;

/**
 * 시군구로 좁힌 뒤 관광지명 부분일치 → 30일 일별 집중률 port. 도메인이 소유(DIP), 구현(어댑터)은 external.
 * 매칭 실패 시 {@link Optional#empty()} (정상 흐름 — 호출부에서 204/섹션 숨김 처리).
 */
public interface CrowdProvider {

    Optional<CrowdForecast> getForecast(CrowdQuery query);
}
