package com.intothepicture.domain.contest.dto;

/** contest 목록 필터 조건(모두 선택, null/blank 는 미적용). */
public record ContestSearchCondition(
    String season,
    String grade,
    String division,
    String sido,
    String keyword
) {
}
