package com.intothepicture.external.contest.dto;

import java.time.LocalDateTime;

/**
 * 공모전 외부 응답 1건의 내부 표현(어댑터 경계). 외부 필드명(koTitle·koWnprzDiz…)은 여기서 끝나고,
 * 이후 도메인/엔티티에는 내부 이름으로만 전달된다(외부 필드명 격리).
 *
 * <p>원문만 담는다 — 부문/등급/계절/시도/시군구 파싱은 sync 단계에서 파서로 수행(원문 보존 → 재파싱 가능).
 */
public record ContestApiItem(
    String contentId,
    String title,
    String titleEn,
    String location,
    String locationEn,
    String sidoCode,
    String photographer,
    String photographerEn,
    String filmMonth,
    String awardRaw,
    String keywordsRaw,
    String orgImageUrl,
    String thumbImageUrl,
    String copyrightCode,
    LocalDateTime externalRegDt,
    LocalDateTime externalMdfcnDt
) {
}
