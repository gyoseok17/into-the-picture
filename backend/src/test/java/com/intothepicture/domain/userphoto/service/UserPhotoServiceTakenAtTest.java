package com.intothepicture.domain.userphoto.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.intothepicture.domain.contest.port.GeocodingProvider;
import com.intothepicture.domain.photorecord.location.MapLocationCatalog;
import com.intothepicture.domain.photorecord.entity.TakenAtSource;
import com.intothepicture.domain.photorecord.repository.PhotoMapLocationRepresentativeRepository;
import com.intothepicture.domain.photorecord.repository.PhotoRecordRepository;
import com.intothepicture.domain.user.repository.UserRepository;
import com.intothepicture.domain.userphoto.metadata.ImageTakenAtExtractor;
import com.intothepicture.domain.userphoto.repository.UserPhotoRepository;
import com.intothepicture.domain.userphoto.storage.FileStorage;
import com.intothepicture.domain.userphoto.validation.ImageUploadValidator;
import com.intothepicture.global.exception.BusinessException;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class UserPhotoServiceTakenAtTest {
    private final ImageTakenAtExtractor extractor = org.mockito.Mockito.mock(ImageTakenAtExtractor.class);
    private final UserPhotoService service = new UserPhotoService(
        org.mockito.Mockito.mock(UserPhotoRepository.class),
        org.mockito.Mockito.mock(PhotoRecordRepository.class),
        org.mockito.Mockito.mock(UserRepository.class),
        org.mockito.Mockito.mock(FileStorage.class),
        org.mockito.Mockito.mock(ImageUploadValidator.class),
        extractor,
        org.mockito.Mockito.mock(GeocodingProvider.class),
        new MapLocationCatalog(),
        org.mockito.Mockito.mock(PhotoMapLocationRepresentativeRepository.class));

    private final MockMultipartFile file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[] {1});

    @Test
    void usesRequestedTakenAtWithoutReadingExif() {
        LocalDateTime requested = LocalDateTime.of(2026, 8, 31, 0, 0);

        assertThat(service.resolveRequiredTakenAt(file, requested)).isEqualTo(requested);

        verify(extractor, never()).extract(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void usesServerExifTakenAtWhenRequestDoesNotProvideOne() {
        LocalDateTime extracted = LocalDateTime.of(2026, 8, 30, 15, 20);
        when(extractor.extract(org.mockito.ArgumentMatchers.any())).thenReturn(Optional.of(extracted));

        assertThat(service.resolveRequiredTakenAt(file, null)).isEqualTo(extracted);
    }

    @Test
    void rejectsWhenNeitherRequestNorServerExifHasTakenAt() {
        when(extractor.extract(org.mockito.ArgumentMatchers.any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.resolveRequiredTakenAt(file, null))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("촬영일을 확인할 수 없습니다");
    }

    @Test
    void bundleUsesExifBeforeTheMatchingManualOverride() {
        LocalDateTime exif = LocalDateTime.of(2026, 8, 29, 10, 15);
        LocalDateTime manual = LocalDateTime.of(2026, 8, 30, 0, 0);
        when(extractor.extract(org.mockito.ArgumentMatchers.any())).thenReturn(Optional.of(exif));

        var resolved = service.resolveBundleTakenAt(file, manual, LocalDateTime.of(2026, 8, 31, 0, 0));

        assertThat(resolved.value()).isEqualTo(exif);
        assertThat(resolved.source()).isEqualTo(TakenAtSource.EXIF);
    }

    @Test
    void bundleUsesManualOverrideWhenExifIsMissing() {
        LocalDateTime manual = LocalDateTime.of(2026, 8, 30, 0, 0);
        when(extractor.extract(org.mockito.ArgumentMatchers.any())).thenReturn(Optional.empty());

        var resolved = service.resolveBundleTakenAt(file, manual, LocalDateTime.of(2026, 8, 31, 0, 0));

        assertThat(resolved.value()).isEqualTo(manual);
        assertThat(resolved.source()).isEqualTo(TakenAtSource.MANUAL);
    }

    @Test
    void bundleUsesStartDateOnlyAsTheLastFallback() {
        LocalDateTime start = LocalDateTime.of(2026, 8, 31, 0, 0);
        when(extractor.extract(org.mockito.ArgumentMatchers.any())).thenReturn(Optional.empty());

        var resolved = service.resolveBundleTakenAt(file, null, start);

        assertThat(resolved.value()).isEqualTo(start);
        assertThat(resolved.source()).isEqualTo(TakenAtSource.BUNDLE_START_FALLBACK);
    }

    @Test
    void bundleRejectsWhenExifManualAndStartDateAreAllMissing() {
        when(extractor.extract(org.mockito.ArgumentMatchers.any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.resolveBundleTakenAt(file, null, null))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("촬영일을 확인할 수 없습니다");
    }
}
