package com.intothepicture.domain.comparison.dto;
import com.intothepicture.domain.contest.dto.ContestSummaryDto;
import com.intothepicture.domain.comparison.entity.ComparisonVisibility;
import com.intothepicture.domain.photorecord.entity.DisplayMode;
import com.intothepicture.domain.userphoto.dto.UserPhotoDto;
import java.time.LocalDateTime;
public final class PhotoComparisonDtos {
    private PhotoComparisonDtos() { }
    public record ComparisonCropDto(Double aspectRatio, Double zoom, Double offsetX, Double offsetY) { }
    public record CreateRequest(Long userPhotoId, Long contestId, ComparisonCropDto crop) { }
    public record ReplacePhotoRequest(Long userPhotoId, ComparisonCropDto crop) { }
    public record UpdateVisibilityRequest(ComparisonVisibility visibility) { }
    public record UpdateCropRequest(ComparisonCropDto crop) { }
    public record ComparisonDto(Long id, UserPhotoDto userPhoto, ContestSummaryDto contest, DisplayMode displayMode,
                                ComparisonVisibility visibility, ComparisonCropDto crop, LocalDateTime createdAt) { }
    /** This type must remain free of personal album fields. */
    public record PublicComparisonDto(Long id, String photoUrl, ComparisonCropDto crop, LocalDateTime createdAt) { }
}
