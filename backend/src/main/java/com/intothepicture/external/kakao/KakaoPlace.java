package com.intothepicture.external.kakao;

/** 카카오 로컬 검색 결과 1건(내부 표현). 외부 필드 x/y(문자열 경/위도)는 여기서 lat/lng 로 정규화한다. */
public record KakaoPlace(String name, double lat, double lng) {
}
