package com.intothepicture.domain.userphoto.dto;

import java.time.LocalDateTime;
import java.util.List;

/** A single map marker representing a bundle or a compatible legacy single-photo record. */
public record PhotoRecordBundleMapPinDto(
    Long id,
    boolean legacy,
    List<UserPhotoDto> photos,
    String placeName,
    String mapRegionCode,
    String mapCityCode,
    LocalDateTime takenAt,
    LocalDateTime endedAt,
    double lat,
    double lng,
    MapPinLocationSource locationSource,
    boolean representative
) { }
