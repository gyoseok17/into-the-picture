package com.intothepicture.domain.userphoto.service;

import com.intothepicture.domain.photorecord.entity.PhotoRecord;
import com.intothepicture.domain.photorecord.entity.PhotoRecordBundle;
import com.intothepicture.domain.photorecord.location.MapLocationCatalog;
import com.intothepicture.domain.photorecord.repository.PhotoRecordBundleRepository;
import com.intothepicture.domain.photorecord.repository.PhotoRecordRepository;
import com.intothepicture.domain.user.repository.UserRepository;
import com.intothepicture.domain.userphoto.dto.PhotoRecordBundleDto;
import com.intothepicture.domain.userphoto.dto.PhotoRecordBundleMapPinDto;
import com.intothepicture.global.exception.BusinessException;
import com.intothepicture.global.exception.ErrorCode;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class PhotoRecordBundleService {
    /** A single travel record intentionally stays small enough to review and upload reliably. */
    public static final int MAX_FILES = 3;
    /**
     * Multipart parameters with an empty value may be omitted by the framework.
     * A concrete placeholder keeps manualTakenAts positionally aligned with files.
     */
    public static final String MANUAL_TAKEN_AT_AUTO = "__AUTO__";
    private final PhotoRecordBundleRepository bundles;
    private final PhotoRecordRepository records;
    private final UserRepository users;
    private final UserPhotoService photos;
    private final MapLocationCatalog mapLocations;

    public PhotoRecordBundleService(PhotoRecordBundleRepository bundles, PhotoRecordRepository records,
                                    UserRepository users, UserPhotoService photos, MapLocationCatalog mapLocations) {
        this.bundles = bundles;
        this.records = records;
        this.users = users;
        this.photos = photos;
        this.mapLocations = mapLocations;
    }

    @Transactional
    public PhotoRecordBundleDto upload(Long userId, List<MultipartFile> files, LocalDateTime takenAt, LocalDateTime endedAt,
                                       List<String> manualTakenAts, String placeName,
                                       String mapRegionCode, String mapCityCode, String memo) {
        if (files == null || files.isEmpty() || files.size() > MAX_FILES) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "files must contain between 1 and 3 images.");
        }
        validatePeriod(takenAt, endedAt);
        var parsedManualTakenAts = parseManualTakenAts(files, manualTakenAts);
        // Validate every file before creating a bundle or storing any physical file.
        // EXIF is primary per photo; a matching manual date and the trip start
        // are progressively weaker fallbacks.
        var resolvedTakenAts = new ArrayList<UserPhotoService.TakenAtResolution>();
        for (int index = 0; index < files.size(); index++) {
            resolvedTakenAts.add(photos.resolveBundleTakenAt(files.get(index), parsedManualTakenAts.get(index), takenAt));
        }
        var location = mapLocations.resolve(normalize(mapRegionCode, 32, "map region code"), normalize(mapCityCode, 48, "map city code"));
        var bundle = bundles.save(PhotoRecordBundle.builder()
            .user(users.findById(userId).orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED)))
            .takenAt(takenAt)
            .endedAt(endedAt)
            .placeName(normalize(placeName, 255, "place name"))
            .mapRegionCode(location.regionCode())
            .mapCityCode(location.cityCode())
            .memo(normalize(memo, 500, "memo"))
            .build());

        var uploadedRecordIds = new ArrayList<Long>();
        try {
            for (int index = 0; index < files.size(); index++) {
                MultipartFile file = files.get(index);
                uploadedRecordIds.add(photos.uploadToBundle(userId, file, resolvedTakenAts.get(index), bundle.getPlaceName(),
                    bundle.getMapRegionCode(), bundle.getMapCityCode(), bundle.getMemo(), bundle).id());
            }
        } catch (RuntimeException exception) {
            // The database transaction rolls back; delete already persisted physical files as compensation.
            uploadedRecordIds.forEach(id -> photos.deleteIncludingComparison(userId, id));
            throw exception;
        }
        return dto(bundle);
    }

    @Transactional(readOnly = true)
    public List<PhotoRecordBundleDto> list(Long userId) {
        var result = new ArrayList<PhotoRecordBundleDto>();
        var bundleList = bundles.findAllByUserIdOrderByCreatedAtDesc(userId);
        bundleList.stream().map(this::dto).forEach(result::add);
        var legacy = records.findAllByUserIdAndBundleIsNullOrderByCreatedAtDesc(userId);
        legacy.stream().map(this::legacyDto).forEach(result::add);
        result.sort(Comparator.comparing(this::sortAt).reversed());
        return result;
    }

    @Transactional
    public List<PhotoRecordBundleMapPinDto> bundleMap(Long userId) {
        return photos.bundleMap(userId);
    }

    @Transactional
    public void delete(Long userId, Long bundleId) {
        var bundle = bundles.findByIdAndUserId(bundleId, userId).orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        var children = records.findAllByBundleIdOrderByCreatedAtAsc(bundleId);
        if (children.stream().anyMatch(record -> record.getContest() != null)) {
            throw new BusinessException(ErrorCode.CONFLICT, "A bundle containing a photo linked to a comparison cannot be deleted.");
        }
        // Delete record/file pairs first. No partial delete is committed if any storage/database operation fails.
        children.forEach(record -> photos.deleteIncludingComparison(userId, record.getId()));
        bundles.delete(bundle);
    }

    public PhotoRecordBundleDto dto(PhotoRecordBundle bundle) {
        return new PhotoRecordBundleDto(bundle.getId(), false,
            records.findAllByBundleIdOrderByCreatedAtAsc(bundle.getId()).stream().map(photos::dto).toList(),
            bundle.getTakenAt(), bundle.getEndedAt(), bundle.getPlaceName(), bundle.getMapRegionCode(), bundle.getMapCityCode(), bundle.getMemo(),
            bundle.getCreatedAt());
    }

    private PhotoRecordBundleDto legacyDto(PhotoRecord record) {
        return new PhotoRecordBundleDto(null, true, List.of(photos.dto(record)), record.getTakenAt(), null,
            record.getPlaceName(), record.getMapRegionCode(), record.getMapCityCode(), record.getMemo(), record.getCreatedAt());
    }

    private LocalDateTime sortAt(PhotoRecordBundleDto value) {
        return value.takenAt() != null ? value.takenAt() : value.createdAt();
    }

    private void validatePeriod(LocalDateTime takenAt, LocalDateTime endedAt) {
        if (endedAt == null) return;
        if (takenAt == null) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "종료일을 지정하려면 시작일을 함께 지정해 주세요.");
        }
        if (endedAt.isBefore(takenAt)) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "종료일은 시작일보다 빠를 수 없습니다.");
        }
    }

    private List<LocalDateTime> parseManualTakenAts(List<MultipartFile> files, List<String> values) {
        if (values == null) {
            return java.util.Collections.nCopies(files.size(), null);
        }
        if (values.size() != files.size()) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST,
                "manualTakenAts must contain one value for each uploaded file.");
        }
        var parsed = new ArrayList<LocalDateTime>();
        for (String value : values) {
            if (value == null || value.isBlank() || MANUAL_TAKEN_AT_AUTO.equals(value)) {
                parsed.add(null);
                continue;
            }
            try {
                String normalized = value.trim();
                parsed.add(normalized.length() == 10
                    ? LocalDate.parse(normalized).atStartOfDay()
                    : LocalDateTime.parse(normalized));
            } catch (DateTimeParseException exception) {
                throw new BusinessException(ErrorCode.INVALID_REQUEST,
                    "manualTakenAts must use yyyy-MM-dd or ISO local datetime values.");
            }
        }
        return parsed;
    }

    private String normalize(String value, int maxLength, String fieldName) {
        if (value == null || value.isBlank()) return null;
        String normalized = value.trim();
        if (normalized.length() > maxLength) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, fieldName + " must be at most " + maxLength + " characters.");
        }
        return normalized;
    }
}
