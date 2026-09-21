package com.intothepicture.domain.userphoto.service;

import com.intothepicture.domain.photorecord.entity.PhotoRecord;
import com.intothepicture.domain.photorecord.entity.PhotoRecordBundle;
import com.intothepicture.domain.photorecord.entity.TakenAtSource;
import com.intothepicture.domain.photorecord.location.MapLocationInputResolver;
import com.intothepicture.domain.photorecord.repository.PhotoRecordRepository;
import com.intothepicture.domain.user.repository.UserRepository;
import com.intothepicture.domain.userphoto.dto.UserPhotoDto;
import com.intothepicture.domain.userphoto.entity.UserPhoto;
import com.intothepicture.domain.userphoto.metadata.ImageTakenAtExtractor;
import com.intothepicture.domain.userphoto.repository.UserPhotoRepository;
import com.intothepicture.domain.userphoto.storage.FileStorage;
import com.intothepicture.domain.userphoto.validation.ImageUploadValidator;
import com.intothepicture.global.exception.BusinessException;
import com.intothepicture.global.exception.ErrorCode;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/** Validates and persists new source files, including upload rollback compensation and taken-at resolution. */
@Service
public class UserPhotoUploadService {
    private final UserPhotoRepository photos;
    private final PhotoRecordRepository records;
    private final UserRepository users;
    private final FileStorage storage;
    private final ImageUploadValidator imageUploadValidator;
    private final ImageTakenAtExtractor imageTakenAtExtractor;
    private final MapLocationInputResolver mapLocationInputResolver;
    private final UserPhotoService photoRecords;

    public UserPhotoUploadService(UserPhotoRepository photos, PhotoRecordRepository records, UserRepository users,
                                  FileStorage storage, ImageUploadValidator imageUploadValidator,
                                  ImageTakenAtExtractor imageTakenAtExtractor, MapLocationInputResolver mapLocationInputResolver,
                                  UserPhotoService photoRecords) {
        this.photos = photos;
        this.records = records;
        this.users = users;
        this.storage = storage;
        this.imageUploadValidator = imageUploadValidator;
        this.imageTakenAtExtractor = imageTakenAtExtractor;
        this.mapLocationInputResolver = mapLocationInputResolver;
        this.photoRecords = photoRecords;
    }

    @Transactional
    public UserPhotoDto upload(Long userId, MultipartFile file, LocalDateTime takenAt, String placeName,
                               String mapRegionCode, String mapCityCode, String memo) {
        return store(userId, file, resolveTakenAt(file, takenAt, null, false), placeName, mapRegionCode, mapCityCode, memo, null).photo();
    }

    /** Reuses the validated single-photo persistence path while associating the new record with one upload bundle. */
    @Transactional
    public BundleUpload uploadToBundle(Long userId, MultipartFile file, TakenAtResolution takenAt, String placeName,
                                       String mapRegionCode, String mapCityCode, String memo, PhotoRecordBundle bundle) {
        return store(userId, file, takenAt, placeName, mapRegionCode, mapCityCode, memo, bundle);
    }

    /**
     * Bundle upload failures roll the database transaction back, so normal after-commit
     * deletion is intentionally unavailable here. Delete the already stored source file now.
     */
    public void deleteStoredFileForRollback(String storageKey, RuntimeException uploadFailure) {
        try {
            storage.delete(storageKey);
        } catch (IOException cleanupFailure) {
            uploadFailure.addSuppressed(cleanupFailure);
        }
    }

    private BundleUpload store(Long userId, MultipartFile file, TakenAtResolution takenAt, String placeName,
                               String mapRegionCode, String mapCityCode, String memo, PhotoRecordBundle bundle) {
        String contentType = imageUploadValidator.validateAndResolveContentType(file);
        String normalizedPlaceName = normalize(placeName, 255, "place name");
        var mapLocation = mapLocationInputResolver.resolve(mapRegionCode, mapCityCode);
        String normalizedMemo = normalize(memo, 500, "memo");
        FileStorage.StoredFile stored = null;
        try {
            var user = users.findById(userId).orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
            stored = storage.store(userId, file);
            var photo = photos.save(UserPhoto.builder().user(user).storageKey(stored.storageKey()).url(stored.url())
                .originalFilename(file.getOriginalFilename()).contentType(contentType).fileSize(file.getSize()).build());
            var record = PhotoRecord.builder().user(user).userPhoto(photo).takenAt(takenAt.value()).takenAtSource(takenAt.source())
                .placeName(normalizedPlaceName).mapRegionCode(mapLocation.regionCode()).mapCityCode(mapLocation.cityCode())
                .memo(normalizedMemo).build();
            record.attachBundle(bundle);
            return new BundleUpload(photoRecords.dto(records.save(record)), stored.storageKey());
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Failed to save the photo.");
        } catch (RuntimeException e) {
            if (stored != null) {
                try { storage.delete(stored.storageKey()); }
                catch (IOException cleanupFailure) { e.addSuppressed(cleanupFailure); }
            }
            throw e;
        }
    }

    /** A photo record cannot be placed on a travel timeline without a date. */
    public LocalDateTime resolveRequiredTakenAt(MultipartFile file, LocalDateTime requestedTakenAt) {
        return resolveTakenAt(file, requestedTakenAt, null, false).value();
    }

    /** Bundle uploads preserve each image's EXIF date before considering UI input or the trip start. */
    public TakenAtResolution resolveBundleTakenAt(MultipartFile file, LocalDateTime manualTakenAt,
                                                  LocalDateTime bundleTakenAt) {
        return resolveTakenAt(file, manualTakenAt, bundleTakenAt, true);
    }

    private TakenAtResolution resolveTakenAt(MultipartFile file, LocalDateTime manualTakenAt,
                                             LocalDateTime bundleTakenAt, boolean preferExif) {
        if (!preferExif && manualTakenAt != null) return new TakenAtResolution(manualTakenAt, TakenAtSource.MANUAL);
        LocalDateTime exifTakenAt = extractTakenAt(file);
        if (preferExif && exifTakenAt != null) return new TakenAtResolution(exifTakenAt, TakenAtSource.EXIF);
        if (manualTakenAt != null) return new TakenAtResolution(manualTakenAt, TakenAtSource.MANUAL);
        if (exifTakenAt != null) return new TakenAtResolution(exifTakenAt, TakenAtSource.EXIF);
        if (bundleTakenAt != null) return new TakenAtResolution(bundleTakenAt, TakenAtSource.BUNDLE_START_FALLBACK);
        throw new BusinessException(ErrorCode.INVALID_REQUEST,
            "촬영일을 확인할 수 없습니다. 사진별 촬영일 또는 여행 시작일을 지정해 주세요.");
    }

    private LocalDateTime extractTakenAt(MultipartFile file) {
        try (InputStream input = file.getInputStream()) { return imageTakenAtExtractor.extract(input).orElse(null); }
        catch (IOException ignored) { return null; }
    }

    private String normalize(String value, int maxLength, String fieldName) {
        if (value == null || value.isBlank()) return null;
        String normalized = value.trim();
        if (normalized.length() > maxLength) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, fieldName + " must be at most " + maxLength + " characters.");
        }
        return normalized;
    }

    public record TakenAtResolution(LocalDateTime value, TakenAtSource source) { }

    /** Internal bundle-upload result keeps the storage key available for rollback compensation. */
    public record BundleUpload(UserPhotoDto photo, String storageKey) { }
}
