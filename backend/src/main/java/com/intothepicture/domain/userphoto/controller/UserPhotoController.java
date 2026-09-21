package com.intothepicture.domain.userphoto.controller;

import com.intothepicture.domain.userphoto.dto.UpdatePhotoRecordRequest;
import com.intothepicture.domain.userphoto.dto.SetMapLocationRepresentativeRequest;
import com.intothepicture.domain.userphoto.dto.PhotoRecordMapPinDto;
import com.intothepicture.domain.userphoto.dto.MapLocationOptionDto;
import com.intothepicture.domain.userphoto.dto.UserPhotoDto;
import com.intothepicture.domain.userphoto.service.UserPhotoService;
import com.intothepicture.domain.userphoto.service.UserPhotoUploadService;
import com.intothepicture.domain.userphoto.service.PhotoRecordMapService;
import com.intothepicture.global.security.JwtService.JwtPrincipal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/me/photos")
public class UserPhotoController {
    private final UserPhotoService service;
    private final UserPhotoUploadService uploads;
    private final PhotoRecordMapService mapService;

    public UserPhotoController(UserPhotoService service, UserPhotoUploadService uploads, PhotoRecordMapService mapService) {
        this.service = service;
        this.uploads = uploads;
        this.mapService = mapService;
    }

    @GetMapping
    public List<UserPhotoDto> list(@AuthenticationPrincipal JwtPrincipal principal) {
        return service.list(principal.userId());
    }

    @GetMapping("/map")
    public List<PhotoRecordMapPinDto> map(@AuthenticationPrincipal JwtPrincipal principal) {
        return mapService.map(principal.userId());
    }

    @GetMapping("/map/locations")
    public List<MapLocationOptionDto> mapLocations(@AuthenticationPrincipal JwtPrincipal principal) {
        return mapService.locations();
    }

    @PutMapping("/map/representative")
    public ResponseEntity<Void> setMapRepresentative(@AuthenticationPrincipal JwtPrincipal principal,
                                                       @RequestBody SetMapLocationRepresentativeRequest request) {
        mapService.setRepresentative(principal.userId(), request.photoRecordId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{photoId}/file")
    public ResponseEntity<Resource> file(@AuthenticationPrincipal JwtPrincipal principal, @PathVariable Long photoId) {
        var file = service.load(principal.userId(), photoId);
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(file.contentType()))
            .contentLength(file.fileSize())
            .body(file.resource());
    }

    @PostMapping(consumes = "multipart/form-data")
    public UserPhotoDto upload(@AuthenticationPrincipal JwtPrincipal principal,
                               @RequestParam MultipartFile file,
                               @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime takenAt,
                               @RequestParam(required = false) String placeName,
                               @RequestParam(required = false) String mapRegionCode,
                               @RequestParam(required = false) String mapCityCode,
                               @RequestParam(required = false) String memo) {
        return uploads.upload(principal.userId(), file, takenAt, placeName, mapRegionCode, mapCityCode, memo);
    }

    @PatchMapping("/{photoId}")
    public UserPhotoDto update(@AuthenticationPrincipal JwtPrincipal principal,
                               @PathVariable Long photoId,
                               @RequestBody UpdatePhotoRecordRequest request) {
        return service.update(principal.userId(), photoId, request);
    }

    @DeleteMapping("/{photoId}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal JwtPrincipal principal, @PathVariable Long photoId) {
        service.delete(principal.userId(), photoId);
        return ResponseEntity.noContent().build();
    }
}
