package com.intothepicture.external.crowd;

import java.time.LocalDate;

/**
 * 집중률 응답 1행(내부 표현). 외부 필드 baseYmd(YYYYMMDD 문자열)·cnctrRate(문자열)는 여기서
 * date·rate 로 정규화한다. tAtsNm/areaNm/signguNm → attractionName/areaNm/sigunguNm.
 */
public record CrowdRow(LocalDate date, double rate, String attractionName, String areaNm, String sigunguNm) {
}
