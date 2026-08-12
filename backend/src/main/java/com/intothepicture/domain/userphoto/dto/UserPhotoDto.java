package com.intothepicture.domain.userphoto.dto;
import java.time.LocalDateTime;
public record UserPhotoDto(Long id, String url, String originalFilename, String contentType, Long fileSize, LocalDateTime takenAt, String memo, LocalDateTime createdAt) {}
