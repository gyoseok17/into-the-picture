package com.intothepicture.domain.crowd.port;

/**
 * 집중률 조회 입력. 시도코드 + 시군구명으로 지역을 좁히고, placeNameText 로 관광지명 부분일치.
 * (contest 플로우 입력: ContestWork 의 sidoCode + sigungu + (crowdAttractionName ?? 촬영지 장소조각))
 */
public record CrowdQuery(String sidoCode, String sigunguName, String placeNameText) {
}
