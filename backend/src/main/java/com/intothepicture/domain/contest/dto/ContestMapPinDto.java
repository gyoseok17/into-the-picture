package com.intothepicture.domain.contest.dto;

/**
 * GET /contests/map 응답 요소(지도 마커 핀). 배열 직접 반환, 페이지네이션 없음.
 * lat·lng 는 둘 다 non-null 인 작품만 포함되므로 항상 값이 있다. thumbUrl 은 https 치환됨.
 */
public record ContestMapPinDto(
    Long id,
    String title,
    String thumbUrl,
    double lat,
    double lng,
    String awardGrade,
    String sido
) {
}
