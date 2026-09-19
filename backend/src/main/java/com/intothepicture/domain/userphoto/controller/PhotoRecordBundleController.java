package com.intothepicture.domain.userphoto.controller;

import com.intothepicture.domain.userphoto.dto.PhotoRecordBundleDto;
import com.intothepicture.domain.userphoto.dto.PhotoRecordBundleMapPinDto;
import com.intothepicture.domain.userphoto.service.PhotoRecordBundleService;
import com.intothepicture.global.security.JwtService.JwtPrincipal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/me/photos/bundles")
public class PhotoRecordBundleController {
    private final PhotoRecordBundleService service;
    public PhotoRecordBundleController(PhotoRecordBundleService service) { this.service = service; }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<PhotoRecordBundleDto> upload(@AuthenticationPrincipal JwtPrincipal principal,
        @RequestParam List<MultipartFile> files,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime takenAt,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endedAt,
        @RequestParam(required = false) List<String> manualTakenAts,
        @RequestParam(required = false) String placeName,
        @RequestParam(required = false) String mapRegionCode,
        @RequestParam(required = false) String mapCityCode,
        @RequestParam(required = false) String memo) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.upload(
            principal.userId(), files, takenAt, endedAt, manualTakenAts, placeName, mapRegionCode, mapCityCode, memo));
    }

    @GetMapping
    public List<PhotoRecordBundleDto> list(@AuthenticationPrincipal JwtPrincipal principal) {
        return service.list(principal.userId());
    }

    @GetMapping("/map")
    public List<PhotoRecordBundleMapPinDto> map(@AuthenticationPrincipal JwtPrincipal principal) {
        return service.bundleMap(principal.userId());
    }

    @DeleteMapping("/{bundleId}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal JwtPrincipal principal, @PathVariable Long bundleId) {
        service.delete(principal.userId(), bundleId);
        return ResponseEntity.noContent().build();
    }
}
