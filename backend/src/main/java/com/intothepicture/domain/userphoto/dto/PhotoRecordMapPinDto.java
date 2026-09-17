package com.intothepicture.domain.userphoto.dto;

import java.time.LocalDateTime;

public record PhotoRecordMapPinDto(
    Long id,
    String url,
    String originalFilename,
    String placeName,
    String mapRegionCode,
    String mapCityCode,
    LocalDateTime takenAt,
    double lat,
    double lng,
    MapPinLocationSource locationSource
) { }
