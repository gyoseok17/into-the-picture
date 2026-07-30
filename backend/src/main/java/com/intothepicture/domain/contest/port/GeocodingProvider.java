package com.intothepicture.domain.contest.port;

import java.util.Optional;

/**
 * 촬영지 텍스트 → 좌표 변환 port. 도메인이 소유(DIP), 구현(어댑터)은 external.
 *
 * <p>구현체 책임: 콤마/슬래시 분리 후 마지막 조각(장소명) 키워드검색 → 0건이면 전체문자열 →
 * 0건이면 첫 조각 주소검색의 2단계 폴백(docs/06 X2·4). 좌표 확보 실패 시 {@link Optional#empty()}.
 */
public interface GeocodingProvider {

    Optional<Coordinate> geocode(String locationText);
}
