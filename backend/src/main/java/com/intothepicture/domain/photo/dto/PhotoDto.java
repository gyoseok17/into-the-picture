package com.intothepicture.domain.photo.dto;

import java.util.List;

/** 관광공사 사진 API를 앱 내부 형식으로 변환한 공개 DTO. */
public record PhotoDto(
    String id,
    String title,
    String imageUrl,
    String location,
    String photographer,
    String filmMonth,
    List<String> keywords
) {}
