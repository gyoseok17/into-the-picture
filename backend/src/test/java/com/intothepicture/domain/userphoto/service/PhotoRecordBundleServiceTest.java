package com.intothepicture.domain.userphoto.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.intothepicture.domain.photorecord.entity.PhotoRecord;
import com.intothepicture.domain.photorecord.entity.PhotoRecordBundle;
import com.intothepicture.domain.photorecord.location.MapLocationCatalog;
import com.intothepicture.domain.photorecord.repository.PhotoRecordBundleRepository;
import com.intothepicture.domain.photorecord.repository.PhotoRecordRepository;
import com.intothepicture.domain.user.repository.UserRepository;
import com.intothepicture.global.exception.BusinessException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockMultipartFile;

class PhotoRecordBundleServiceTest {
    private final PhotoRecordBundleRepository bundles = org.mockito.Mockito.mock(PhotoRecordBundleRepository.class);
    private final PhotoRecordRepository records = org.mockito.Mockito.mock(PhotoRecordRepository.class);
    private final UserRepository users = org.mockito.Mockito.mock(UserRepository.class);
    private final UserPhotoService photos = org.mockito.Mockito.mock(UserPhotoService.class);
    private final PhotoRecordBundleService service = new PhotoRecordBundleService(
        bundles, records, users, photos, new MapLocationCatalog());

    @Test
    void rejectsMoreThanThreeFilesBeforeCreatingAnyRecord() {
        java.util.List<org.springframework.web.multipart.MultipartFile> files = Collections.nCopies(4,
            new MockMultipartFile("files", "photo.jpg", "image/jpeg", new byte[] {1}));

        assertThatThrownBy(() -> service.upload(1L, files, null, null, null, null, null, null, null))
            .isInstanceOf(BusinessException.class);

        verify(bundles, never()).save(org.mockito.Mockito.any());
        verify(photos, never()).uploadToBundle(org.mockito.Mockito.anyLong(), org.mockito.Mockito.any(), org.mockito.Mockito.any(),
            org.mockito.Mockito.any(), org.mockito.Mockito.any(), org.mockito.Mockito.any(), org.mockito.Mockito.any(), org.mockito.Mockito.any());
    }

    @Test
    void acceptsThreeFilesAtTheBundleSizeBoundaryBeforeFurtherValidation() {
        java.util.List<org.springframework.web.multipart.MultipartFile> files = Collections.nCopies(3,
            new MockMultipartFile("files", "photo.jpg", "image/jpeg", new byte[] {1}));
        when(photos.resolveBundleTakenAt(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.isNull(),
            org.mockito.ArgumentMatchers.isNull()))
            .thenReturn(new UserPhotoService.TakenAtResolution(LocalDateTime.of(2026, 9, 12, 0, 0),
                com.intothepicture.domain.photorecord.entity.TakenAtSource.EXIF))
            .thenReturn(new UserPhotoService.TakenAtResolution(LocalDateTime.of(2026, 9, 12, 0, 0),
                com.intothepicture.domain.photorecord.entity.TakenAtSource.EXIF))
            .thenThrow(new BusinessException(com.intothepicture.global.exception.ErrorCode.INVALID_REQUEST, "stop after boundary validation"));

        assertThatThrownBy(() -> service.upload(1L, files, null, null, null, null, null, null, null))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("stop after boundary validation");

        verify(photos, org.mockito.Mockito.times(3)).resolveBundleTakenAt(org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.isNull(), org.mockito.ArgumentMatchers.isNull());
        verify(bundles, never()).save(org.mockito.Mockito.any());
    }

    @Test
    void rejectsBundleBeforeCreatingItWhenAnyFileHasNoExifManualOrBundleStartTakenAt() {
        java.util.List<org.springframework.web.multipart.MultipartFile> files = java.util.List.of(
            new MockMultipartFile("files", "dated.jpg", "image/jpeg", new byte[] {1}),
            new MockMultipartFile("files", "undated.jpg", "image/jpeg", new byte[] {1}));
        when(photos.resolveBundleTakenAt(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.isNull(),
            org.mockito.ArgumentMatchers.isNull()))
            .thenReturn(new UserPhotoService.TakenAtResolution(java.time.LocalDateTime.of(2026, 8, 31, 0, 0),
                com.intothepicture.domain.photorecord.entity.TakenAtSource.EXIF))
            .thenThrow(new BusinessException(com.intothepicture.global.exception.ErrorCode.INVALID_REQUEST,
                "촬영일을 확인할 수 없습니다. 촬영일을 직접 지정해 주세요."));

        assertThatThrownBy(() -> service.upload(1L, files, null, null, null, null, null, null, null))
            .isInstanceOf(BusinessException.class);

        verify(bundles, never()).save(org.mockito.Mockito.any());
        verify(photos, never()).uploadToBundle(org.mockito.Mockito.anyLong(), org.mockito.Mockito.any(), org.mockito.Mockito.any(),
            org.mockito.Mockito.any(), org.mockito.Mockito.any(), org.mockito.Mockito.any(), org.mockito.Mockito.any(), org.mockito.Mockito.any());
    }

    @Test
    void rejectsManualTakenAtValuesThatDoNotAlignWithFilesBeforeCreatingAnyRecord() {
        java.util.List<org.springframework.web.multipart.MultipartFile> files = java.util.List.of(
            new MockMultipartFile("files", "first.jpg", "image/jpeg", new byte[] {1}),
            new MockMultipartFile("files", "second.jpg", "image/jpeg", new byte[] {1}));

        assertThatThrownBy(() -> service.upload(1L, files, LocalDateTime.of(2026, 8, 31, 0, 0), null,
            java.util.List.of("2026-08-30"), null, null, null, null))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("manualTakenAts");

        verify(bundles, never()).save(org.mockito.Mockito.any());
        verify(photos, never()).resolveBundleTakenAt(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any());
    }

    @Test
    void keepsAutoPlaceholderPositionWhenOnlyALaterFileHasAManualTakenAt() {
        java.util.List<org.springframework.web.multipart.MultipartFile> files = java.util.List.of(
            new MockMultipartFile("files", "first.jpg", "image/jpeg", new byte[] {1}),
            new MockMultipartFile("files", "second.jpg", "image/jpeg", new byte[] {1}));

        assertThatThrownBy(() -> service.upload(1L, files, null, null,
            java.util.List.of(PhotoRecordBundleService.MANUAL_TAKEN_AT_AUTO, "2026-08-30"),
            null, null, null, null)).isInstanceOf(BusinessException.class);

        ArgumentCaptor<LocalDateTime> manualTakenAt = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(photos, org.mockito.Mockito.times(2)).resolveBundleTakenAt(org.mockito.ArgumentMatchers.any(), manualTakenAt.capture(),
            org.mockito.ArgumentMatchers.isNull());
        assertThat(manualTakenAt.getAllValues()).containsExactly(null, LocalDateTime.of(2026, 8, 30, 0, 0));
    }

    @Test
    void rejectsEndedAtWithoutTakenAtBeforeCreatingAnyRecord() {
        java.util.List<org.springframework.web.multipart.MultipartFile> files = java.util.List.of(
            new MockMultipartFile("files", "photo.jpg", "image/jpeg", new byte[] {1}));

        assertThatThrownBy(() -> service.upload(1L, files, null, LocalDateTime.of(2026, 8, 31, 0, 0),
            null, null, null, null, null))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("종료일");

        verify(bundles, never()).save(org.mockito.Mockito.any());
        verify(photos, never()).uploadToBundle(org.mockito.Mockito.anyLong(), org.mockito.Mockito.any(), org.mockito.Mockito.any(),
            org.mockito.Mockito.any(), org.mockito.Mockito.any(), org.mockito.Mockito.any(), org.mockito.Mockito.any(), org.mockito.Mockito.any());
    }

    @Test
    void rejectsEndedAtBeforeTakenAtBeforeCreatingAnyRecord() {
        java.util.List<org.springframework.web.multipart.MultipartFile> files = java.util.List.of(
            new MockMultipartFile("files", "photo.jpg", "image/jpeg", new byte[] {1}));

        assertThatThrownBy(() -> service.upload(1L, files, LocalDateTime.of(2026, 8, 31, 0, 0),
            LocalDateTime.of(2026, 8, 30, 0, 0), null, null, null, null, null))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("시작일");

        verify(bundles, never()).save(org.mockito.Mockito.any());
        verify(photos, never()).uploadToBundle(org.mockito.Mockito.anyLong(), org.mockito.Mockito.any(), org.mockito.Mockito.any(),
            org.mockito.Mockito.any(), org.mockito.Mockito.any(), org.mockito.Mockito.any(), org.mockito.Mockito.any(), org.mockito.Mockito.any());
    }

    @Test
    void refusesBundleDeletionBeforeDeletingAnythingWhenAComparisonIsPresent() {
        var bundle = org.mockito.Mockito.mock(PhotoRecordBundle.class);
        var comparisonRecord = org.mockito.Mockito.mock(PhotoRecord.class);
        when(bundles.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(bundle));
        when(records.findAllByBundleIdOrderByCreatedAtAsc(10L)).thenReturn(java.util.List.of(comparisonRecord));
        when(comparisonRecord.getContest()).thenReturn(org.mockito.Mockito.mock(com.intothepicture.domain.contest.entity.ContestWork.class));

        assertThatThrownBy(() -> service.delete(1L, 10L)).isInstanceOf(BusinessException.class);

        verify(photos, never()).deleteIncludingComparison(org.mockito.Mockito.anyLong(), org.mockito.Mockito.anyLong());
        verify(bundles, never()).delete(org.mockito.Mockito.any());
    }
}
