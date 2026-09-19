package com.intothepicture.domain.userphoto.service;

import com.intothepicture.domain.photorecord.entity.DisplayMode;
import com.intothepicture.domain.photorecord.entity.PhotoMapLocationRepresentative;
import com.intothepicture.domain.photorecord.entity.PhotoRecord;
import com.intothepicture.domain.photorecord.entity.PhotoRecordBundle;
import com.intothepicture.domain.photorecord.entity.TakenAtSource;
import com.intothepicture.domain.photorecord.location.MapLocationCatalog;
import com.intothepicture.domain.photorecord.repository.PhotoMapLocationRepresentativeRepository;
import com.intothepicture.domain.photorecord.repository.PhotoRecordRepository;
import com.intothepicture.domain.contest.port.GeocodingProvider;
import com.intothepicture.domain.userphoto.dto.PhotoRecordMapPinDto;
import com.intothepicture.domain.userphoto.dto.PhotoRecordBundleMapPinDto;
import com.intothepicture.domain.userphoto.dto.MapLocationOptionDto;
import com.intothepicture.domain.userphoto.dto.MapPinLocationSource;
import com.intothepicture.domain.user.repository.UserRepository;
import com.intothepicture.domain.userphoto.dto.UpdatePhotoRecordRequest;
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
import java.util.LinkedHashMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class UserPhotoService {
    private static final int MAP_GEOCODE_LIMIT = 20;
    private static final java.time.Duration GEOCODE_RETRY_INTERVAL = java.time.Duration.ofHours(24);
    private final UserPhotoRepository photos;
    private final PhotoRecordRepository records;
    private final UserRepository users;
    private final FileStorage storage;
    private final ImageUploadValidator imageUploadValidator;
    private final ImageTakenAtExtractor imageTakenAtExtractor;
    private final GeocodingProvider geocodingProvider;
    private final MapLocationCatalog mapLocations;
    private final PhotoMapLocationRepresentativeRepository mapRepresentatives;

    public UserPhotoService(UserPhotoRepository photos, PhotoRecordRepository records, UserRepository users,
                            FileStorage storage, ImageUploadValidator imageUploadValidator, ImageTakenAtExtractor imageTakenAtExtractor,
                            GeocodingProvider geocodingProvider, MapLocationCatalog mapLocations,
                            PhotoMapLocationRepresentativeRepository mapRepresentatives) {
        this.photos = photos;
        this.records = records;
        this.users = users;
        this.storage = storage;
        this.imageUploadValidator = imageUploadValidator;
        this.imageTakenAtExtractor = imageTakenAtExtractor;
        this.geocodingProvider = geocodingProvider;
        this.mapLocations = mapLocations;
        this.mapRepresentatives = mapRepresentatives;
    }

    @Transactional(readOnly = true)
    public List<UserPhotoDto> list(Long userId) {
        return records.findAllByUserIdForAlbum(userId).stream().map(this::dto).toList();
    }

    @Transactional
    public List<PhotoRecordMapPinDto> map(Long userId) {
        var recordsForAlbum = records.findAllByUserIdForAlbum(userId);
        geocodeMissingPlaces(recordsForAlbum);
        return recordsForAlbum.stream()
            .map(this::mapPin)
            .flatMap(Optional::stream)
            .toList();
    }

    /** Bundle-level map contract. Legacy records deliberately remain one-photo markers. */
    @Transactional
    public List<PhotoRecordBundleMapPinDto> bundleMap(Long userId) {
        var recordsForAlbum = records.findAllByUserIdForAlbum(userId);
        geocodeMissingPlaces(recordsForAlbum);
        Map<String, List<PhotoRecord>> groups = new LinkedHashMap<>();
        for (PhotoRecord record : recordsForAlbum) {
            String key = record.getBundle() == null ? "legacy-" + record.getId() : "bundle-" + record.getBundle().getId();
            groups.computeIfAbsent(key, ignored -> new java.util.ArrayList<>()).add(record);
        }
        var activeById = new HashMap<Long, PhotoRecord>();
        recordsForAlbum.forEach(record -> activeById.put(record.getId(), record));
        var selectedByLocation = new HashMap<String, Long>();
        for (PhotoMapLocationRepresentative selected : mapRepresentatives.findAllByUserIdAndRepresentativePhotoIsNotNull(userId)) {
            Long selectedPhotoId = selected.getRepresentativePhoto().getId();
            PhotoRecord selectedRecord = activeById.get(selectedPhotoId);
            // A later location edit can move a record; an old representative
            // setting must then behave as empty rather than suppress fallback.
            if (selectedRecord != null && selected.getLocationKey().equals(locationKey(selectedRecord))) {
                selectedByLocation.put(selected.getLocationKey(), selectedPhotoId);
            }
        }

        var representedLocations = new java.util.HashSet<String>();
        var result = new java.util.ArrayList<PhotoRecordBundleMapPinDto>();
        for (List<PhotoRecord> groupedRecords : groups.values()) {
            bundleMapPin(groupedRecords).ifPresent(pin -> {
                String locationKey = locationKey(pin);
                Long selectedPhotoId = selectedByLocation.get(locationKey);
                boolean explicit = selectedPhotoId != null && groupedRecords.stream()
                    .anyMatch(record -> record.getId().equals(selectedPhotoId));
                boolean fallback = selectedPhotoId == null && representedLocations.add(locationKey);
                result.add(withRepresentative(pin, explicit || fallback));
            });
        }
        return result;
    }

    @Transactional
    public void setMapRepresentative(Long userId, Long photoRecordId) {
        if (photoRecordId == null) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "photoRecordId is required.");
        }
        var record = findOwnedRecord(userId, photoRecordId);
        String locationKey = locationKey(record);
        var representative = mapRepresentatives.findByUserIdAndLocationKey(userId, locationKey)
            .orElseGet(() -> PhotoMapLocationRepresentative.builder()
                .user(record.getUser())
                .locationKey(locationKey)
                .representativePhoto(record)
                .build());
        representative.changeRepresentativePhoto(record);
        mapRepresentatives.save(representative);
    }

    @Transactional(readOnly = true)
    public List<MapLocationOptionDto> mapLocations() {
        return mapLocations.regions().stream()
            .map(region -> new MapLocationOptionDto(region.code(), region.label(), region.cities().stream()
                .map(city -> new MapLocationOptionDto.MapCityOptionDto(city.code(), city.label(), city.latitude(), city.longitude()))
                .toList()))
            .toList();
    }

    @Transactional
    public UserPhotoDto upload(Long userId, MultipartFile file, LocalDateTime takenAt, String placeName,
                               String mapRegionCode, String mapCityCode, String memo) {
        return upload(userId, file, resolveTakenAt(file, takenAt, null, false), placeName, mapRegionCode, mapCityCode, memo, null);
    }

    private UserPhotoDto upload(Long userId, MultipartFile file, TakenAtResolution takenAt,
                                String placeName, String mapRegionCode, String mapCityCode, String memo,
                                PhotoRecordBundle bundle) {
        String contentType = imageUploadValidator.validateAndResolveContentType(file);
        String normalizedPlaceName = normalize(placeName, 255, "place name");
        var mapLocation = mapLocations.resolve(normalize(mapRegionCode, 32, "map region code"), normalize(mapCityCode, 48, "map city code"));
        String normalizedMemo = normalize(memo, 500, "memo");
        FileStorage.StoredFile stored = null;
        try {
            var user = users.findById(userId).orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
            stored = storage.store(userId, file);
            var photo = photos.save(UserPhoto.builder()
                .user(user)
                .storageKey(stored.storageKey())
                .url(stored.url())
                .originalFilename(file.getOriginalFilename())
                .contentType(contentType)
                .fileSize(file.getSize())
                .build());
            var record = PhotoRecord.builder()
                .user(user)
                .userPhoto(photo)
                .takenAt(takenAt.value())
                .takenAtSource(takenAt.source())
                .placeName(normalizedPlaceName)
                .mapRegionCode(mapLocation.regionCode())
                .mapCityCode(mapLocation.cityCode())
                .memo(normalizedMemo)
                .build();
            record.attachBundle(bundle);
            return dto(records.save(record));
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Failed to save the photo.");
        } catch (RuntimeException e) {
            if (stored != null) {
                try {
                    storage.delete(stored.storageKey());
                } catch (IOException cleanupFailure) {
                    e.addSuppressed(cleanupFailure);
                }
            }
            throw e;
        }
    }

    /** Reuses the validated single-photo persistence path while associating the new record with one upload bundle. */
    @Transactional
    public UserPhotoDto uploadToBundle(Long userId, MultipartFile file, TakenAtResolution takenAt, String placeName,
                                       String mapRegionCode, String mapCityCode, String memo, PhotoRecordBundle bundle) {
        return upload(userId, file, takenAt, placeName, mapRegionCode, mapCityCode, memo, bundle);
    }

    /**
     * A photo record cannot be placed on a travel timeline without a date.
     * A request value wins; otherwise the server, not the browser, reads EXIF.
     */
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

    @Transactional
    public UserPhotoDto update(Long userId, Long recordId, UpdatePhotoRecordRequest request) {
        var record = findOwnedRecord(userId, recordId);
        if (request.hasTakenAt()) record.changeTakenAt(request.takenAt());
        if (request.hasPlaceName()) record.changePlaceName(normalize(request.placeName(), 255, "place name"));
        if (request.hasMapRegionCode() || request.hasMapCityCode()) {
            String regionCode = request.hasMapRegionCode()
                ? normalize(request.mapRegionCode(), 32, "map region code") : record.getMapRegionCode();
            String cityCode = request.hasMapCityCode()
                ? normalize(request.mapCityCode(), 48, "map city code") : record.getMapCityCode();
            var mapLocation = mapLocations.resolve(regionCode, cityCode);
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
            try {
                storage.delete(photo.getStorageKey());
            } catch (IOException e) {
                throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Failed to delete the photo file.");
            }
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
        return new UserPhotoDto(
            record.getId(),
            "/me/photos/" + record.getId() + "/file",
            photo.getOriginalFilename(),
            photo.getContentType(),
            photo.getFileSize(),
            record.getTakenAt(),
            record.getTakenAtSource(),
            record.getPlaceName(),
            record.getMapRegionCode(),
            record.getMapCityCode(),
            record.getMemo(),
            record.getContest() == null ? null : record.getContest().getId(),
            record.getDisplayMode(),
            record.getCreatedAt()
        );
    }

    private void geocodeMissingPlaces(List<PhotoRecord> activeRecords) {
        LocalDateTime retryBefore = LocalDateTime.now().minus(GEOCODE_RETRY_INTERVAL);
        Map<String, List<PhotoRecord>> byPlace = new LinkedHashMap<>();
        for (PhotoRecord record : activeRecords) {
            if (!record.needsGeocoding(retryBefore)) continue;
            byPlace.computeIfAbsent(record.getPlaceName().trim(), ignored -> new java.util.ArrayList<>()).add(record);
        }
        byPlace.entrySet().stream().limit(MAP_GEOCODE_LIMIT).forEach(entry -> {
            var coordinate = geocodingProvider.geocode(entry.getKey()).orElse(null);
            for (PhotoRecord record : entry.getValue()) {
                record.recordGeocoding(coordinate == null ? null : coordinate.lat(), coordinate == null ? null : coordinate.lng());
            }
        });
    }

    private Optional<PhotoRecordMapPinDto> mapPin(PhotoRecord record) {
        var photo = record.getUserPhoto();
        if (record.getLatitude() != null && record.getLongitude() != null) {
            return Optional.of(new PhotoRecordMapPinDto(record.getId(), "/me/photos/" + record.getId() + "/file",
                photo.getOriginalFilename(), record.getPlaceName(), record.getMapRegionCode(), record.getMapCityCode(),
                record.getTakenAt(), record.getLatitude(), record.getLongitude(), MapPinLocationSource.PLACE));
        }
        return mapLocations.city(record.getMapCityCode()).map(city -> new PhotoRecordMapPinDto(record.getId(),
            "/me/photos/" + record.getId() + "/file", photo.getOriginalFilename(), record.getPlaceName(),
            record.getMapRegionCode(), record.getMapCityCode(), record.getTakenAt(), city.latitude(), city.longitude(),
            MapPinLocationSource.CITY));
    }

    private Optional<PhotoRecordBundleMapPinDto> bundleMapPin(List<PhotoRecord> groupedRecords) {
        PhotoRecord representative = groupedRecords.get(0);
        return mapPin(representative).map(pin -> {
            var bundle = representative.getBundle();
            return new PhotoRecordBundleMapPinDto(
                bundle == null ? null : bundle.getId(),
                bundle == null,
                groupedRecords.stream().map(this::dto).toList(),
                bundle == null ? representative.getPlaceName() : bundle.getPlaceName(),
                bundle == null ? representative.getMapRegionCode() : bundle.getMapRegionCode(),
                bundle == null ? representative.getMapCityCode() : bundle.getMapCityCode(),
                bundle == null ? representative.getTakenAt() : bundle.getTakenAt(),
                bundle == null ? null : bundle.getEndedAt(),
                pin.lat(), pin.lng(), pin.locationSource(), false);
        });
    }

    private PhotoRecordBundleMapPinDto withRepresentative(PhotoRecordBundleMapPinDto pin, boolean representative) {
        return new PhotoRecordBundleMapPinDto(pin.id(), pin.legacy(), pin.photos(), pin.placeName(), pin.mapRegionCode(),
            pin.mapCityCode(), pin.takenAt(), pin.endedAt(), pin.lat(), pin.lng(), pin.locationSource(), representative);
    }

    private String locationKey(PhotoRecordBundleMapPinDto pin) {
        if (pin.mapRegionCode() != null && pin.mapCityCode() != null) {
            return "CITY:" + pin.mapRegionCode() + ":" + pin.mapCityCode();
        }
        return String.format(java.util.Locale.ROOT, "PLACE:%.3f:%.3f", pin.lat(), pin.lng());
    }

    private String locationKey(PhotoRecord record) {
        if (record.getMapRegionCode() != null && record.getMapCityCode() != null) {
            return "CITY:" + record.getMapRegionCode() + ":" + record.getMapCityCode();
        }
        if (record.getLatitude() != null && record.getLongitude() != null) {
            return String.format(java.util.Locale.ROOT, "PLACE:%.3f:%.3f", record.getLatitude(), record.getLongitude());
        }
        geocodeMissingPlaces(List.of(record));
        if (record.getLatitude() != null && record.getLongitude() != null) {
            return String.format(java.util.Locale.ROOT, "PLACE:%.3f:%.3f", record.getLatitude(), record.getLongitude());
        }
        throw new BusinessException(ErrorCode.INVALID_REQUEST, "The photo record does not have a map location.");
    }

    private LocalDateTime extractTakenAt(MultipartFile file) {
        try (InputStream input = file.getInputStream()) {
            return imageTakenAtExtractor.extract(input).orElse(null);
        } catch (IOException ignored) {
            return null;
        }
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

    public record TakenAtResolution(LocalDateTime value, TakenAtSource source) { }
}
