package com.intothepicture.domain.userphoto.dto;

import java.time.LocalDateTime;
import java.util.List;

/** One upload session, or a compatible legacy single-photo item when {@code legacy} is true. */
public record PhotoRecordBundleDto(
    Long id,
    boolean legacy,
    List<UserPhotoDto> photos,
    LocalDateTime takenAt,
    LocalDateTime endedAt,
    String placeName,
    String mapRegionCode,
    String mapCityCode,
    String memo,
    LocalDateTime archivedAt,
    LocalDateTime createdAt
) { }
