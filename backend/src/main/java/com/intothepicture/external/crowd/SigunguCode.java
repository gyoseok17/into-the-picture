package com.intothepicture.external.crowd;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** 시군구 코드표 1행(sigungu-codes.json). 집중률 API 의 areaCd+signguCd 해석에 사용. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record SigunguCode(String areaCd, String areaNm, String sigunguCd, String sigunguNm) {
}
