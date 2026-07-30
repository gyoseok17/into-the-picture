package com.intothepicture.domain.contest.dto;

import java.util.List;

/** GET /contests content[] 요소. 외부 필드명 비노출, thumbUrl 은 https 치환됨. season 은 없으면 null. */
public record ContestSummaryDto(
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
    List<String> keywords
) {
}
