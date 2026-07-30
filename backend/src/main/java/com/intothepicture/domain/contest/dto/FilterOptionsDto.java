package com.intothepicture.domain.contest.dto;

import java.util.List;

/** GET /contests/filters. 데이터에 실제 존재하는 필터 값 목록(UI 구성용). */
public record FilterOptionsDto(
    List<String> seasons,
    List<String> grades,
    List<String> divisions,
    List<String> sidos
) {
}
