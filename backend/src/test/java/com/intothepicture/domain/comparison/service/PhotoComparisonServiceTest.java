package com.intothepicture.domain.comparison.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.intothepicture.domain.contest.entity.ContestWork;
import com.intothepicture.domain.comparison.entity.ComparisonVisibility;
import com.intothepicture.domain.comparison.dto.PhotoComparisonDtos.ComparisonCropDto;
import com.intothepicture.domain.contest.repository.ContestRepository;
import com.intothepicture.domain.favorite.entity.FavoriteTargetType;
import com.intothepicture.domain.favorite.repository.FavoriteRepository;
import com.intothepicture.domain.photorecord.entity.PhotoRecord;
import com.intothepicture.domain.photorecord.repository.PhotoRecordRepository;
import com.intothepicture.domain.userphoto.dto.UserPhotoDto;
import com.intothepicture.domain.userphoto.service.UserPhotoService;
import com.intothepicture.domain.userphoto.storage.FileStorage;
import com.intothepicture.global.exception.BusinessException;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class PhotoComparisonServiceTest {
    private final PhotoRecordRepository records = org.mockito.Mockito.mock(PhotoRecordRepository.class);
    private final UserPhotoService photos = org.mockito.Mockito.mock(UserPhotoService.class);
    private final ContestRepository contests = org.mockito.Mockito.mock(ContestRepository.class);
    private final FavoriteRepository favorites = org.mockito.Mockito.mock(FavoriteRepository.class);
    private final FileStorage storage = org.mockito.Mockito.mock(FileStorage.class);
    private final PhotoComparisonService service = new PhotoComparisonService(records, photos, contests, favorites, storage);

    @Test
    void rejectsAContestThatTheUserHasNotSaved() {
        var record = org.mockito.Mockito.mock(PhotoRecord.class);
        var contest = contest(94L);
        when(photos.findOwnedRecord(1L, 10L)).thenReturn(record);
        when(contests.findById(94L)).thenReturn(Optional.of(contest));
        when(favorites.existsByUserIdAndTargetTypeAndExternalId(1L, FavoriteTargetType.CONTEST, "94")).thenReturn(false);

        assertThatThrownBy(() -> service.create(1L, 10L, 94L))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("저장한 수상작");

        verify(records, never()).existsByUserIdAndContestId(org.mockito.ArgumentMatchers.anyLong(), org.mockito.ArgumentMatchers.anyLong());
        verify(record, never()).attachContest(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void rejectsASecondRecordForTheSameSavedContest() {
        var record = org.mockito.Mockito.mock(PhotoRecord.class);
        var contest = contest(94L);
        when(photos.findOwnedRecord(1L, 10L)).thenReturn(record);
        when(contests.findById(94L)).thenReturn(Optional.of(contest));
        when(favorites.existsByUserIdAndTargetTypeAndExternalId(1L, FavoriteTargetType.CONTEST, "94")).thenReturn(true);
        when(records.existsByUserIdAndContestId(1L, 94L)).thenReturn(true);

        assertThatThrownBy(() -> service.create(1L, 10L, 94L))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("기존 기록을 수정");

        verify(record, never()).attachContest(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void attachesAOwnedPhotoRecordToOneSavedContest() {
        var record = org.mockito.Mockito.mock(PhotoRecord.class);
        var contest = contest(94L);
        when(photos.findOwnedRecord(1L, 10L)).thenReturn(record);
        when(contests.findById(94L)).thenReturn(Optional.of(contest));
        when(favorites.existsByUserIdAndTargetTypeAndExternalId(1L, FavoriteTargetType.CONTEST, "94")).thenReturn(true);
        when(records.existsByUserIdAndContestId(1L, 94L)).thenReturn(false);
        when(record.getContest()).thenReturn(null, contest);
        when(record.getId()).thenReturn(10L);
        when(photos.dto(record)).thenReturn(org.mockito.Mockito.mock(UserPhotoDto.class));

        var result = service.create(1L, 10L, 94L);

        verify(record).attachContest(contest);
        assertThat(result.id()).isEqualTo(10L);
        assertThat(result.contest().id()).isEqualTo(94L);
    }

    @Test
    void newContestAttachmentDefaultsToPublic() {
        var record = com.intothepicture.domain.photorecord.entity.PhotoRecord.builder()
            .user(org.mockito.Mockito.mock(com.intothepicture.domain.user.entity.User.class))
            .userPhoto(org.mockito.Mockito.mock(com.intothepicture.domain.userphoto.entity.UserPhoto.class))
            .build();

        record.attachContest(contest(94L));

        assertThat(record.getComparisonVisibility()).isEqualTo(ComparisonVisibility.PUBLIC);
    }

    @Test
    void ownerCanChangeComparisonVisibility() {
        var record = org.mockito.Mockito.mock(PhotoRecord.class);
        var contest = contest(94L);
        when(photos.findOwnedRecord(1L, 10L)).thenReturn(record);
        when(record.getContest()).thenReturn(contest);
        when(record.getId()).thenReturn(10L);
        when(photos.dto(record)).thenReturn(org.mockito.Mockito.mock(UserPhotoDto.class));
        when(record.getComparisonVisibility()).thenReturn(ComparisonVisibility.PRIVATE);

        service.changeVisibility(1L, 10L, ComparisonVisibility.PRIVATE);

        verify(record).changeComparisonVisibility(ComparisonVisibility.PRIVATE);
    }

    @Test
    void ownerCanSaveAComparisonCrop() {
        var record = org.mockito.Mockito.mock(PhotoRecord.class);
        var linkedContest = contest(94L);
        when(photos.findOwnedRecord(1L, 10L)).thenReturn(record);
        when(record.getContest()).thenReturn(linkedContest);
        when(record.getId()).thenReturn(10L);
        when(photos.dto(record)).thenReturn(org.mockito.Mockito.mock(UserPhotoDto.class));

        service.changeCrop(1L, 10L, new ComparisonCropDto(1.5, 1.2, -.3, .4));

        verify(record).changeComparisonCrop(1.5, 1.2, -.3, .4);
    }

    @Test
    void rejectsInvalidComparisonCropBeforeItReachesTheEntity() {
        var record = org.mockito.Mockito.mock(PhotoRecord.class);
        var linkedContest = contest(94L);
        when(photos.findOwnedRecord(1L, 10L)).thenReturn(record);
        when(record.getContest()).thenReturn(linkedContest);

        assertThatThrownBy(() -> service.changeCrop(1L, 10L, new ComparisonCropDto(4.1, 1d, 0d, 0d)))
            .isInstanceOf(BusinessException.class);

        verify(record, never()).changeComparisonCrop(org.mockito.ArgumentMatchers.anyDouble(),
            org.mockito.ArgumentMatchers.anyDouble(), org.mockito.ArgumentMatchers.anyDouble(),
            org.mockito.ArgumentMatchers.anyDouble());
    }

    @Test
    void nonOwnerCannotChangeVisibilityBecauseOwnedRecordLookupIsRequired() {
        when(photos.findOwnedRecord(2L, 10L)).thenThrow(new BusinessException(com.intothepicture.global.exception.ErrorCode.NOT_FOUND));

        assertThatThrownBy(() -> service.changeVisibility(2L, 10L, ComparisonVisibility.PRIVATE))
            .isInstanceOf(BusinessException.class);

        verify(records, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void publicListUsesOnlyThePublicActiveRepositoryBoundary() {
        var record = org.mockito.Mockito.mock(PhotoRecord.class);
        when(record.getId()).thenReturn(10L);
        when(record.getContestLinkedAt()).thenReturn(java.time.LocalDateTime.of(2026, 9, 12, 10, 0));
        when(record.getComparisonCrop()).thenReturn(new com.intothepicture.domain.comparison.entity.ComparisonCrop(1.5, 1.2, .1, -.2));
        when(records.findAllByContestIdAndComparisonVisibilityOrderByContestLinkedAtDesc(94L, ComparisonVisibility.PUBLIC))
            .thenReturn(java.util.List.of(record));

        var result = service.listPublic(94L);

        assertThat(result).singleElement().satisfies(publicComparison -> {
            assertThat(publicComparison.photoUrl()).isEqualTo("/api/v1/contests/94/comparisons/10/file");
            assertThat(publicComparison.id()).isEqualTo(10L);
            assertThat(publicComparison.crop()).isEqualTo(new ComparisonCropDto(1.5, 1.2, .1, -.2));
        });
        verify(records).findAllByContestIdAndComparisonVisibilityOrderByContestLinkedAtDesc(94L, ComparisonVisibility.PUBLIC);
    }

    @Test
    void privateOrWrongContestPublicFileLookupNeverReadsStorage() throws java.io.IOException {
        when(records.findByIdAndContestIdAndComparisonVisibility(10L, 94L, ComparisonVisibility.PUBLIC))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.loadPublicFile(94L, 10L)).isInstanceOf(BusinessException.class);

        verify(storage, never()).load(org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void publicFileReadsOnlyThePhotoResolvedByPublicContestScope() throws java.io.IOException {
        var record = org.mockito.Mockito.mock(PhotoRecord.class);
        var photo = org.mockito.Mockito.mock(com.intothepicture.domain.userphoto.entity.UserPhoto.class);
        var resource = org.mockito.Mockito.mock(org.springframework.core.io.Resource.class);
        when(records.findByIdAndContestIdAndComparisonVisibility(10L, 94L, ComparisonVisibility.PUBLIC))
            .thenReturn(Optional.of(record));
        when(record.getUserPhoto()).thenReturn(photo);
        when(photo.getStorageKey()).thenReturn("owner-7/opaque-file.jpg");
        when(photo.getContentType()).thenReturn("image/jpeg");
        when(photo.getFileSize()).thenReturn(42L);
        when(storage.load("owner-7/opaque-file.jpg")).thenReturn(resource);

        var file = service.loadPublicFile(94L, 10L);

        assertThat(file.resource()).isSameAs(resource);
        verify(storage).load("owner-7/opaque-file.jpg");
    }

    @Test
    void replacingAPrivateComparisonPreservesItsVisibility() {
        var current = org.mockito.Mockito.mock(PhotoRecord.class);
        var replacement = org.mockito.Mockito.mock(PhotoRecord.class);
        var contest = contest(94L);
        when(photos.findOwnedRecord(1L, 10L)).thenReturn(current);
        when(photos.findOwnedRecord(1L, 11L)).thenReturn(replacement);
        when(current.getContest()).thenReturn(contest);
        when(current.getComparisonVisibility()).thenReturn(ComparisonVisibility.PRIVATE);
        when(replacement.getContest()).thenReturn(null, contest);
        when(replacement.getId()).thenReturn(11L);
        when(photos.dto(replacement)).thenReturn(org.mockito.Mockito.mock(UserPhotoDto.class));
        when(replacement.getComparisonVisibility()).thenReturn(ComparisonVisibility.PRIVATE);

        service.replacePhoto(1L, 10L, 11L);

        verify(replacement).changeComparisonVisibility(ComparisonVisibility.PRIVATE);
    }

    private ContestWork contest(Long id) {
        var contest = org.mockito.Mockito.mock(ContestWork.class);
        when(contest.getId()).thenReturn(id);
        return contest;
    }
}
