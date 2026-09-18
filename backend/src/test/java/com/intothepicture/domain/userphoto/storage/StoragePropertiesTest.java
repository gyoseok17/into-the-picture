package com.intothepicture.domain.userphoto.storage;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class StoragePropertiesTest {
    @Test
    void rejectsAnUnknownStorageType() {
        var properties = new StorageProperties();
        properties.setType("filesystem");

        assertThatThrownBy(properties::validateType)
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("APP_STORAGE_TYPE");
    }

    @Test
    void requiresBothRegionAndBucketForS3() {
        var properties = new StorageProperties();

        assertThatThrownBy(properties::requireS3Configuration)
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("AWS_REGION");

        properties.getS3().setRegion("ap-northeast-2");
        assertThatThrownBy(properties::requireS3Configuration)
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("APP_STORAGE_S3_BUCKET");
    }

    @Test
    void acceptsACompleteS3Configuration() {
        var properties = new StorageProperties();
        properties.getS3().setRegion("ap-northeast-2");
        properties.getS3().setBucket("private-photo-bucket");

        assertThatCode(properties::requireS3Configuration).doesNotThrowAnyException();
    }
}
