package com.intothepicture.external.kakao;

/** 카카오 로컬 검색 결과 1건. ID는 keyword/category place results only; address results may omit it. */
public record KakaoPlace(String id, String name, double lat, double lng) {

    public KakaoPlace(String name, double lat, double lng) {
        this(null, name, lat, lng);
    }
}
