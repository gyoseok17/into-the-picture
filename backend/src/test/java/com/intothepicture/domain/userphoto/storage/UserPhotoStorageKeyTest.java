package com.intothepicture.domain.userphoto.storage;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class UserPhotoStorageKeyTest {
    @Test
    void keepsTheExistingUserScopedKeyFormatAndNormalizesExtension() {
        assertThat(UserPhotoStorageKey.create(7L, "travel.JPEG"))
            .matches("u/7/[0-9a-f-]{36}\\.jpeg");
    }

    @Test
    void defaultsToJpgWhenTheOriginalFilenameHasNoExtension() {
        assertThat(UserPhotoStorageKey.create(7L, "travel"))
            .matches("u/7/[0-9a-f-]{36}\\.jpg");
    }

    @Test
    void neverLetsAnUntrustedFilenameCreatePathSegmentsInTheStorageKey() {
        String key = UserPhotoStorageKey.create(7L, "travel.jpg/../../another-object");

        assertThat(key).matches("u/7/[0-9a-f-]{36}\\.jpg");
        assertThat(key).doesNotContain("..").doesNotContain("\\");
    }
}
