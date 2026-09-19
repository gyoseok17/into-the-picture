package com.intothepicture.domain.comparison.service;

import com.intothepicture.domain.comparison.dto.PhotoComparisonDtos.ComparisonDto;
import com.intothepicture.domain.comparison.dto.PhotoComparisonDtos.ComparisonCropDto;
import com.intothepicture.domain.comparison.dto.PhotoComparisonDtos.PublicComparisonDto;
import com.intothepicture.domain.comparison.entity.ComparisonCrop;
import com.intothepicture.domain.comparison.entity.ComparisonVisibility;
import com.intothepicture.domain.contest.dto.ContestMapper;
import com.intothepicture.domain.contest.repository.ContestRepository;
import com.intothepicture.domain.favorite.entity.FavoriteTargetType;
import com.intothepicture.domain.favorite.repository.FavoriteRepository;
import com.intothepicture.domain.photorecord.repository.PhotoRecordRepository;
import com.intothepicture.domain.userphoto.service.UserPhotoService;
import com.intothepicture.domain.userphoto.storage.FileStorage;
import com.intothepicture.global.exception.BusinessException;
import com.intothepicture.global.exception.ErrorCode;
import java.util.List;
import java.io.IOException;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Comparison records attach one owned PhotoRecord to one saved contest work. */
@Service
public class PhotoComparisonService {
    private final PhotoRecordRepository records;
    private final UserPhotoService photos;
    private final ContestRepository contests;
    private final FavoriteRepository favorites;
    private final FileStorage storage;

    public PhotoComparisonService(PhotoRecordRepository records, UserPhotoService photos, ContestRepository contests,
                                  FavoriteRepository favorites, FileStorage storage) {
        this.records = records;
        this.photos = photos;
        this.contests = contests;
        this.favorites = favorites;
        this.storage = storage;
    }

    @Transactional
    public ComparisonDto create(Long userId, Long recordId, Long contestId) {
        return create(userId, recordId, contestId, null);
    }

    @Transactional
    public ComparisonDto create(Long userId, Long recordId, Long contestId, ComparisonCropDto crop) {
        var record = photos.findOwnedRecord(userId, recordId);
        var contest = contests.findById(contestId).orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        if (!favorites.existsByUserIdAndTargetTypeAndExternalId(userId, FavoriteTargetType.CONTEST, contestId.toString())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "저장한 수상작만 사진 놓기를 만들 수 있습니다.");
        }
        if (records.existsByUserIdAndContestId(userId, contestId)) {
            throw new BusinessException(ErrorCode.CONFLICT, "이 수상작은 이미 사진 놓기 기록이 있습니다. 기존 기록을 수정해 주세요.");
        }
        if (record.getContest() != null) {
            throw new BusinessException(ErrorCode.CONFLICT, "이미 다른 수상작과 연결된 사진입니다.");
        }
        record.attachContest(contest);
        applyCrop(record, crop);
        return dto(record);
    }

    @Transactional(readOnly = true)
    public List<ComparisonDto> list(Long userId) {
        return records.findAllByUserIdAndContestIsNotNullOrderByContestLinkedAtDesc(userId).stream().map(this::dto).toList();
    }

    @Transactional
    public ComparisonDto replacePhoto(Long userId, Long comparisonId, Long replacementRecordId) {
        return replacePhoto(userId, comparisonId, replacementRecordId, null);
    }

    @Transactional
    public ComparisonDto replacePhoto(Long userId, Long comparisonId, Long replacementRecordId, ComparisonCropDto crop) {
        var current = photos.findOwnedRecord(userId, comparisonId);
        if (current.getContest() == null) throw new BusinessException(ErrorCode.NOT_FOUND);
        var replacement = photos.findOwnedRecord(userId, replacementRecordId);
        if (replacement.getContest() != null) {
            throw new BusinessException(ErrorCode.CONFLICT, "이미 사진 놓기에 사용 중인 사진입니다.");
        }
        var contest = current.getContest();
        var visibility = current.getComparisonVisibility();
        current.detachContest();
        replacement.attachContest(contest);
        replacement.changeComparisonVisibility(visibility);
        if (crop == null) {
            var currentCrop = cropDto(current);
            replacement.changeComparisonCrop(currentCrop.aspectRatio(), ComparisonCrop.DEFAULT_ZOOM,
                ComparisonCrop.DEFAULT_POSITION, ComparisonCrop.DEFAULT_POSITION);
        } else {
            applyCrop(replacement, crop);
        }
        return dto(replacement);
    }

    @Transactional
    public ComparisonDto changeVisibility(Long userId, Long comparisonId, ComparisonVisibility visibility) {
        if (visibility == null) throw new BusinessException(ErrorCode.INVALID_REQUEST, "visibility is required.");
        var record = photos.findOwnedRecord(userId, comparisonId);
        if (record.getContest() == null) throw new BusinessException(ErrorCode.NOT_FOUND);
        record.changeComparisonVisibility(visibility);
        return dto(record);
    }

    @Transactional
    public ComparisonDto changeCrop(Long userId, Long comparisonId, ComparisonCropDto crop) {
        var record = photos.findOwnedRecord(userId, comparisonId);
        if (record.getContest() == null) throw new BusinessException(ErrorCode.NOT_FOUND);
        applyCrop(record, crop);
        return dto(record);
    }

    @Transactional(readOnly = true)
    public List<PublicComparisonDto> listPublic(Long contestId) {
        return records.findAllByContestIdAndComparisonVisibilityOrderByContestLinkedAtDesc(
                contestId, ComparisonVisibility.PUBLIC)
            .stream()
            .map(record -> new PublicComparisonDto(record.getId(), publicFileUrl(contestId, record.getId()), cropDto(record), record.getContestLinkedAt()))
            .toList();
    }

    /** The lookup deliberately validates contest + visibility before any storage key is read. */
    @Transactional(readOnly = true)
    public PublicComparisonFile loadPublicFile(Long contestId, Long comparisonId) {
        var record = records.findByIdAndContestIdAndComparisonVisibility(
                comparisonId, contestId, ComparisonVisibility.PUBLIC)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        var photo = record.getUserPhoto();
        try {
            return new PublicComparisonFile(storage.load(photo.getStorageKey()), photo.getContentType(), photo.getFileSize());
        } catch (IOException exception) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
    }

    @Transactional
    public void delete(Long userId, Long recordId, boolean deletePhoto) {
        var record = photos.findOwnedRecord(userId, recordId);
        if (record.getContest() == null) throw new BusinessException(ErrorCode.NOT_FOUND);
        if (deletePhoto) {
            photos.deleteIncludingComparison(userId, recordId);
            return;
        }
        record.detachContest();
    }

    private ComparisonDto dto(com.intothepicture.domain.photorecord.entity.PhotoRecord record) {
        return new ComparisonDto(record.getId(), photos.dto(record), ContestMapper.toSummary(record.getContest()),
            record.getDisplayMode(), record.getComparisonVisibility(), cropDto(record), record.getContestLinkedAt());
    }

    private void applyCrop(com.intothepicture.domain.photorecord.entity.PhotoRecord record, ComparisonCropDto crop) {
        if (crop == null) return;
        var targetAspectRatio = requireRange(crop.aspectRatio(), .25d, 4d, "aspectRatio");
        var zoom = requireRange(crop.zoom(), 1d, 4d, "zoom");
        var positionX = requireRange(crop.offsetX(), -1d, 1d, "offsetX");
        var positionY = requireRange(crop.offsetY(), -1d, 1d, "offsetY");
        record.changeComparisonCrop(targetAspectRatio, zoom, positionX, positionY);
    }

    private double requireRange(Double value, double minimum, double maximum, String field) {
        if (value == null || !Double.isFinite(value) || value < minimum || value > maximum) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, field + " is invalid.");
        }
        return value;
    }

    private ComparisonCropDto cropDto(com.intothepicture.domain.photorecord.entity.PhotoRecord record) {
        var crop = record.getComparisonCrop();
        if (crop == null) {
            return new ComparisonCropDto(ComparisonCrop.DEFAULT_TARGET_ASPECT_RATIO, ComparisonCrop.DEFAULT_ZOOM,
                ComparisonCrop.DEFAULT_POSITION, ComparisonCrop.DEFAULT_POSITION);
        }
        return new ComparisonCropDto(crop.getTargetAspectRatio(), crop.getZoom(), crop.getPositionX(), crop.getPositionY());
    }

    private String publicFileUrl(Long contestId, Long comparisonId) {
        return "/api/v1/contests/" + contestId + "/comparisons/" + comparisonId + "/file";
    }

    public record PublicComparisonFile(Resource resource, String contentType, Long fileSize) { }
}
