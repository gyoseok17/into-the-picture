package com.intothepicture.domain.userphoto.service;

import com.intothepicture.domain.contest.port.GeocodingProvider;
import com.intothepicture.domain.photorecord.entity.PhotoMapLocationRepresentative;
import com.intothepicture.domain.photorecord.entity.PhotoRecord;
import com.intothepicture.domain.photorecord.location.MapLocationCatalog;
import com.intothepicture.domain.photorecord.repository.PhotoMapLocationRepresentativeRepository;
import com.intothepicture.domain.photorecord.repository.PhotoRecordRepository;
import com.intothepicture.domain.userphoto.dto.MapLocationOptionDto;
import com.intothepicture.domain.userphoto.dto.MapPinLocationSource;
import com.intothepicture.domain.userphoto.dto.PhotoRecordBundleMapPinDto;
import com.intothepicture.domain.userphoto.dto.PhotoRecordMapPinDto;
import com.intothepicture.global.exception.BusinessException;
import com.intothepicture.global.exception.ErrorCode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Projects saved records onto the album map and owns geocoding and representative-pin policy. */
@Service
public class PhotoRecordMapService {
    private static final int MAP_GEOCODE_LIMIT = 20;
    private static final java.time.Duration GEOCODE_RETRY_INTERVAL = java.time.Duration.ofHours(24);
    private final PhotoRecordRepository records;
    private final GeocodingProvider geocodingProvider;
    private final MapLocationCatalog mapLocations;
    private final PhotoMapLocationRepresentativeRepository mapRepresentatives;
    private final UserPhotoService photoRecords;

    public PhotoRecordMapService(PhotoRecordRepository records, GeocodingProvider geocodingProvider,
                                 MapLocationCatalog mapLocations,
                                 PhotoMapLocationRepresentativeRepository mapRepresentatives,
                                 UserPhotoService photoRecords) {
        this.records = records;
        this.geocodingProvider = geocodingProvider;
        this.mapLocations = mapLocations;
        this.mapRepresentatives = mapRepresentatives;
        this.photoRecords = photoRecords;
    }

    @Transactional
    public List<PhotoRecordMapPinDto> map(Long userId) {
        var recordsForAlbum = records.findAllByUserIdForAlbum(userId);
        geocodeMissingPlaces(recordsForAlbum);
        return recordsForAlbum.stream().map(this::mapPin).flatMap(Optional::stream).toList();
    }

    /** Bundle-level map contract. Legacy records deliberately remain one-photo markers. */
    @Transactional
    public List<PhotoRecordBundleMapPinDto> bundleMap(Long userId) {
        var recordsForAlbum = records.findAllByUserIdForAlbum(userId);
        geocodeMissingPlaces(recordsForAlbum);
        Map<String, List<PhotoRecord>> groups = new LinkedHashMap<>();
        for (PhotoRecord record : recordsForAlbum) {
            String key = record.getBundle() == null ? "legacy-" + record.getId() : "bundle-" + record.getBundle().getId();
            groups.computeIfAbsent(key, ignored -> new ArrayList<>()).add(record);
        }
        var activeById = new HashMap<Long, PhotoRecord>();
        recordsForAlbum.forEach(record -> activeById.put(record.getId(), record));
        var selectedByLocation = new HashMap<String, Long>();
        for (PhotoMapLocationRepresentative selected : mapRepresentatives.findAllByUserIdAndRepresentativePhotoIsNotNull(userId)) {
            Long selectedPhotoId = selected.getRepresentativePhoto().getId();
            PhotoRecord selectedRecord = activeById.get(selectedPhotoId);
            if (selectedRecord != null && selected.getLocationKey().equals(locationKey(selectedRecord))) {
                selectedByLocation.put(selected.getLocationKey(), selectedPhotoId);
            }
        }

        var representedLocations = new java.util.HashSet<String>();
        var result = new ArrayList<PhotoRecordBundleMapPinDto>();
        for (List<PhotoRecord> groupedRecords : groups.values()) {
            bundleMapPin(groupedRecords).ifPresent(pin -> {
                String locationKey = locationKey(pin);
                Long selectedPhotoId = selectedByLocation.get(locationKey);
                boolean explicit = selectedPhotoId != null && groupedRecords.stream().anyMatch(record -> record.getId().equals(selectedPhotoId));
                boolean fallback = selectedPhotoId == null && representedLocations.add(locationKey);
                result.add(withRepresentative(pin, explicit || fallback));
            });
        }
        return result;
    }

    @Transactional
    public void setRepresentative(Long userId, Long photoRecordId) {
        if (photoRecordId == null) throw new BusinessException(ErrorCode.INVALID_REQUEST, "photoRecordId is required.");
        var record = photoRecords.findOwnedRecord(userId, photoRecordId);
        String locationKey = locationKey(record);
        var representative = mapRepresentatives.findByUserIdAndLocationKey(userId, locationKey)
            .orElseGet(() -> PhotoMapLocationRepresentative.builder().user(record.getUser()).locationKey(locationKey)
                .representativePhoto(record).build());
        representative.changeRepresentativePhoto(record);
        mapRepresentatives.save(representative);
    }

    @Transactional(readOnly = true)
    public List<MapLocationOptionDto> locations() {
        return mapLocations.regions().stream().map(region -> new MapLocationOptionDto(region.code(), region.label(),
            region.cities().stream().map(city -> new MapLocationOptionDto.MapCityOptionDto(city.code(), city.label(),
                city.latitude(), city.longitude())).toList())).toList();
    }

    private void geocodeMissingPlaces(List<PhotoRecord> activeRecords) {
        LocalDateTime retryBefore = LocalDateTime.now().minus(GEOCODE_RETRY_INTERVAL);
        Map<String, List<PhotoRecord>> byPlace = new LinkedHashMap<>();
        for (PhotoRecord record : activeRecords) {
            if (!record.needsGeocoding(retryBefore)) continue;
            byPlace.computeIfAbsent(record.getPlaceName().trim(), ignored -> new ArrayList<>()).add(record);
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
            return new PhotoRecordBundleMapPinDto(bundle == null ? null : bundle.getId(), bundle == null,
                groupedRecords.stream().map(photoRecords::dto).toList(), bundle == null ? representative.getPlaceName() : bundle.getPlaceName(),
                bundle == null ? representative.getMapRegionCode() : bundle.getMapRegionCode(),
                bundle == null ? representative.getMapCityCode() : bundle.getMapCityCode(), bundle == null ? representative.getTakenAt() : bundle.getTakenAt(),
                bundle == null ? null : bundle.getEndedAt(), pin.lat(), pin.lng(), pin.locationSource(), false);
        });
    }

    private PhotoRecordBundleMapPinDto withRepresentative(PhotoRecordBundleMapPinDto pin, boolean representative) {
        return new PhotoRecordBundleMapPinDto(pin.id(), pin.legacy(), pin.photos(), pin.placeName(), pin.mapRegionCode(),
            pin.mapCityCode(), pin.takenAt(), pin.endedAt(), pin.lat(), pin.lng(), pin.locationSource(), representative);
    }

    private String locationKey(PhotoRecordBundleMapPinDto pin) {
        if (pin.mapRegionCode() != null && pin.mapCityCode() != null) return "CITY:" + pin.mapRegionCode() + ":" + pin.mapCityCode();
        return String.format(java.util.Locale.ROOT, "PLACE:%.3f:%.3f", pin.lat(), pin.lng());
    }

    private String locationKey(PhotoRecord record) {
        if (record.getMapRegionCode() != null && record.getMapCityCode() != null) return "CITY:" + record.getMapRegionCode() + ":" + record.getMapCityCode();
        if (record.getLatitude() != null && record.getLongitude() != null) {
            return String.format(java.util.Locale.ROOT, "PLACE:%.3f:%.3f", record.getLatitude(), record.getLongitude());
        }
        geocodeMissingPlaces(List.of(record));
        if (record.getLatitude() != null && record.getLongitude() != null) {
            return String.format(java.util.Locale.ROOT, "PLACE:%.3f:%.3f", record.getLatitude(), record.getLongitude());
        }
        throw new BusinessException(ErrorCode.INVALID_REQUEST, "The photo record does not have a map location.");
    }
}
