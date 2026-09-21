package com.intothepicture.domain.userphoto.service;

import static org.mockito.Mockito.verify;

import com.intothepicture.domain.photorecord.location.MapLocationCatalog;
import com.intothepicture.domain.photorecord.location.MapLocationInputResolver;
import com.intothepicture.domain.photorecord.repository.PhotoRecordRepository;
import com.intothepicture.domain.user.repository.UserRepository;
import com.intothepicture.domain.userphoto.metadata.ImageTakenAtExtractor;
import com.intothepicture.domain.userphoto.repository.UserPhotoRepository;
import com.intothepicture.domain.userphoto.storage.FileStorage;
import com.intothepicture.domain.userphoto.validation.ImageUploadValidator;
import org.junit.jupiter.api.Test;

class UserPhotoUploadServiceRollbackTest {
    @Test
    void rollbackCompensationDeletesTheStoredSourceImmediatelyWithoutUsingNormalDeletion() throws Exception {
        var records = org.mockito.Mockito.mock(UserPhotoService.class);
        var storage = org.mockito.Mockito.mock(FileStorage.class);
        var service = new UserPhotoUploadService(org.mockito.Mockito.mock(UserPhotoRepository.class),
            org.mockito.Mockito.mock(PhotoRecordRepository.class), org.mockito.Mockito.mock(UserRepository.class), storage,
            org.mockito.Mockito.mock(ImageUploadValidator.class), org.mockito.Mockito.mock(ImageTakenAtExtractor.class),
            new MapLocationInputResolver(new MapLocationCatalog()), records);
        var failure = new RuntimeException("later upload failed");

        service.deleteStoredFileForRollback("users/1/photo.jpg", failure);

        verify(storage).delete("users/1/photo.jpg");
    }
}
