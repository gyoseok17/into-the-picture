package com.intothepicture.domain.userphoto.dto;
import com.intothepicture.domain.photorecord.entity.DisplayMode;
import com.intothepicture.domain.photorecord.entity.TakenAtSource;
import java.time.LocalDateTime;

/** 사용자 파일이 아닌, 앨범에서 관리하는 사진 기록의 응답 형태다. */
public record UserPhotoDto(
    Long id,
    String url,
    String originalFilename,
    String contentType,
    Long fileSize,
    LocalDateTime takenAt,
    TakenAtSource takenAtSource,
    String placeName,
    String mapRegionCode,
    String mapCityCode,
    String memo,
    Long contestId,
    DisplayMode displayMode,
    LocalDateTime createdAt
) { }
