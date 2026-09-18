package com.intothepicture.domain.userphoto.storage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockMultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

class S3FileStorageTest {
    private final S3Client s3 = org.mockito.Mockito.mock(S3Client.class);
    private final S3FileStorage storage = new S3FileStorage(s3, "private-photo-bucket");

    @Test
    void preservesTheUserScopedStorageKeyAndPrivateApplicationUrl() throws Exception {
        var file = new MockMultipartFile("file", "travel.PNG", "image/png", "image".getBytes(StandardCharsets.UTF_8));

        var stored = storage.store(42L, file);

        assertThat(stored.storageKey()).matches("u/42/[0-9a-f-]{36}\\.png");
        assertThat(stored.url()).isEqualTo("/files/" + stored.storageKey());
        var request = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(s3).putObject(request.capture(), any(RequestBody.class));
        assertThat(request.getValue().bucket()).isEqualTo("private-photo-bucket");
        assertThat(request.getValue().key()).isEqualTo(stored.storageKey());
        assertThat(request.getValue().contentType()).isEqualTo("image/png");
    }

    @Test
    void deletesOnlyAUserPhotoKey() throws Exception {
        storage.delete("u/42/a-photo.jpg");

        var request = ArgumentCaptor.forClass(DeleteObjectRequest.class);
        verify(s3).deleteObject(request.capture());
        assertThat(request.getValue().bucket()).isEqualTo("private-photo-bucket");
        assertThat(request.getValue().key()).isEqualTo("u/42/a-photo.jpg");
    }

    @Test
    void rejectsKeysOutsideTheUserPhotoNamespace() {
        assertThatThrownBy(() -> storage.delete("contest/1.jpg"))
            .isInstanceOf(java.io.IOException.class);
        assertThatThrownBy(() -> storage.load("u/42/../../other.jpg"))
            .isInstanceOf(java.io.IOException.class);
    }

    @Test
    void wrapsObjectStoreFailuresAsStorageIoFailures() {
        org.mockito.Mockito.doThrow(S3Exception.builder().message("access denied").build())
            .when(s3).deleteObject(any(DeleteObjectRequest.class));

        assertThatThrownBy(() -> storage.delete("u/42/a-photo.jpg"))
            .isInstanceOf(java.io.IOException.class)
            .hasMessageContaining("object storage");
    }
}
