package com.intothepicture.domain.contest.dto;

import java.util.List;

/**
 * GET /contests/{id}. 요약 필드(평면) + 원본 imageUrl(https) + 좌표 + 검증된 지도 코드 + 저작권 + crowdAvailable.
 * lat/lng 는 지오코딩 전이면 null(상세 조회 시 on-demand 로 채움). crowdAvailable=true 면 프론트가 /crowd 호출.
 */
public record ContestDetailDto(
    Long id,
    String title,
    String thumbUrl,
    String location,
    String sido,
    String sigungu,
    String photographer,
    String filmMonth,
    String awardDivision,
    String awardGrade,
    String season,
    List<String> keywords,
    String imageUrl,
    Double lat,
    Double lng,
    String kakaoPlaceId,
    String mapRegionCode,
    String mapCityCode,
    String copyright,
    boolean crowdAvailable
) {
}
