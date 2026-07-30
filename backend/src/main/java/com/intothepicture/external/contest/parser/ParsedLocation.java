package com.intothepicture.external.contest.parser;

/**
 * 촬영지(koFilmst) 파싱 결과. sido/sigungu 는 저장·필터용, placeName(마지막 조각)은 지오코딩·집중률 매칭용.
 * 파싱 실패 시 각 필드는 null 일 수 있다.
 */
public record ParsedLocation(String sido, String sigungu, String placeName) {
}
