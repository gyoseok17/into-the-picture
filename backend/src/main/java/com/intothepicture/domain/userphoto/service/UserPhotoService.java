package com.intothepicture.domain.userphoto.service;

import com.intothepicture.domain.photorecord.entity.DisplayMode;
import com.intothepicture.domain.photorecord.entity.PhotoRecord;
import com.intothepicture.domain.photorecord.location.MapLocationInputResolver;
import com.intothepicture.domain.photorecord.repository.PhotoRecordRepository;
import com.intothepicture.domain.userphoto.dto.UpdatePhotoRecordRequest;
import com.intothepicture.domain.userphoto.dto.UserPhotoDto;
import com.intothepicture.domain.userphoto.entity.UserPhoto;
import com.intothepicture.domain.userphoto.repository.UserPhotoRepository;
import com.intothepicture.domain.userphoto.storage.AfterCommitFileDeletion;
import com.intothepicture.domain.userphoto.storage.FileStorage;
import com.intothepicture.global.exception.BusinessException;
import com.intothepicture.global.exception.ErrorCode;
import java.io.IOException;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Owns existing photo-record lookup, edits, deletion, DTO mapping and private file access. */
@Service
public class UserPhotoService {
    private final UserPhotoRepository photos;
    private final PhotoRecordRepository records;
    private final FileStorage storage;
    private final AfterCommitFileDeletion afterCommitFileDeletion;
    private final MapLocationInputResolver mapLocationInputResolver;

    public UserPhotoService(UserPhotoRepository photos, PhotoRecordRepository records, FileStorage storage,
                            AfterCommitFileDeletion afterCommitFileDeletion, MapLocationInputResolver mapLocationInputResolver) {
        this.photos = photos;
        this.records = records;
        this.storage = storage;
        this.afterCommitFileDeletion = afterCommitFileDeletion;
        this.mapLocationInputResolver = mapLocationInputResolver;
    }

    @Transactional(readOnly = true)
    public List<UserPhotoDto> list(Long userId) {
        return records.findAllByUserIdForAlbum(userId).stream().map(this::dto).toList();
    }

    @Transactional
    public UserPhotoDto update(Long userId, Long recordId, UpdatePhotoRecordRequest request) {
        var record = findOwnedRecord(userId, recordId);
        if (request.hasTakenAt()) record.changeTakenAt(request.takenAt());
        if (request.hasPlaceName()) record.changePlaceName(normalize(request.placeName(), 255, "place name"));
        if (request.hasMapRegionCode() || request.hasMapCityCode()) {
            String regionCode = request.hasMapRegionCode() ? request.mapRegionCode() : record.getMapRegionCode();
            String cityCode = request.hasMapCityCode() ? request.mapCityCode() : record.getMapCityCode();
            var mapLocation = mapLocationInputResolver.resolve(regionCode, cityCode);
            record.changeMapLocation(mapLocation.regionCode(), mapLocation.cityCode());
        }
        if (request.hasMemo()) record.changeMemo(normalize(request.memo(), 500, "memo"));
        if (request.displayMode() != null) changeDisplayMode(record, request.displayMode());
        return dto(record);
    }

    @Transactional
    public void delete(Long userId, Long recordId) {
        deleteRecord(userId, recordId, false);
    }

    @Transactional
    public void deleteIncludingComparison(Long userId, Long recordId) {
        deleteRecord(userId, recordId, true);
    }

    private void deleteRecord(Long userId, Long recordId, boolean includeComparison) {
        var record = findOwnedRecord(userId, recordId);
        if (!includeComparison && record.getContest() != null) {
            throw new BusinessException(ErrorCode.CONFLICT, "A photo linked to a comparison cannot be deleted.");
        }
        var photo = record.getUserPhoto();
        records.delete(record);
        if (!records.existsByUserPhotoId(photo.getId())) {
            photos.delete(photo);
            afterCommitFileDeletion.schedule(photo.getStorageKey());
        }
    }

    @Transactional(readOnly = true)
    public PhotoRecord findOwnedRecord(Long userId, Long recordId) {
        return records.findByIdAndUserId(recordId, userId).orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public PhotoFile load(Long userId, Long recordId) {
        var photo = findOwnedRecord(userId, recordId).getUserPhoto();
        try {
            return new PhotoFile(storage.load(photo.getStorageKey()), photo.getContentType(), photo.getFileSize());
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
    }

    public UserPhotoDto dto(PhotoRecord record) {
        var photo = record.getUserPhoto();
        return new UserPhotoDto(record.getId(), "/me/photos/" + record.getId() + "/file", photo.getOriginalFilename(),
            photo.getContentType(), photo.getFileSize(), record.getTakenAt(), record.getTakenAtSource(), record.getPlaceName(),
            record.getMapRegionCode(), record.getMapCityCode(), record.getMemo(),
            record.getContest() == null ? null : record.getContest().getId(), record.getDisplayMode(), record.getCreatedAt());
    }

    private void changeDisplayMode(PhotoRecord record, DisplayMode displayMode) {
        if (displayMode == DisplayMode.WITH_CONTEST && record.getContest() == null) {
            throw new BusinessException(ErrorCode.CONFLICT, "A contest display needs a linked contest work.");
        }
        record.changeDisplayMode(displayMode);
    }

    private String normalize(String value, int maxLength, String fieldName) {
        if (value == null || value.isBlank()) return null;
        String normalized = value.trim();
        if (normalized.length() > maxLength) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, fieldName + " must be at most " + maxLength + " characters.");
        }
        return normalized;
    }

    public record PhotoFile(Resource resource, String contentType, Long fileSize) { }
}
