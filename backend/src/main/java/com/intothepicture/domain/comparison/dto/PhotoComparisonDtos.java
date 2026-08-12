package com.intothepicture.domain.comparison.dto;
import com.intothepicture.domain.contest.dto.ContestSummaryDto;
import com.intothepicture.domain.userphoto.dto.UserPhotoDto;
import java.time.LocalDateTime;
public final class PhotoComparisonDtos { private PhotoComparisonDtos() {} public record CreateRequest(Long userPhotoId, Long contestId) {} public record ReplacePhotoRequest(Long userPhotoId) {} public record ComparisonDto(Long id, UserPhotoDto userPhoto, ContestSummaryDto contest, LocalDateTime createdAt) {} }
