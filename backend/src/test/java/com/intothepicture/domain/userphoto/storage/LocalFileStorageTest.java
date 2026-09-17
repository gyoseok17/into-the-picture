package com.intothepicture.domain.userphoto.storage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.web.multipart.MultipartFile;

class LocalFileStorageTest {
    @TempDir Path temporaryDirectory;

    @Test
    void removesTheTemporaryFileWhenCopyingTheUploadFails() throws Exception {
        MultipartFile brokenFile = org.mockito.Mockito.mock(MultipartFile.class);
        when(brokenFile.getOriginalFilename()).thenReturn("broken.jpg");
        when(brokenFile.getInputStream()).thenReturn(new InputStream() {
            @Override public int read() throws IOException { throw new IOException("stream failed"); }
        });
        var storage = new LocalFileStorage(temporaryDirectory.toString());

        assertThatThrownBy(() -> storage.store(7L, brokenFile)).isInstanceOf(IOException.class);

        Path userDirectory = temporaryDirectory.resolve("u/7");
        try (Stream<Path> files = Files.list(userDirectory)) {
            assertThat(files).isEmpty();
        }
    }

    @Test
    void rejectsADeletePathOutsideTheStorageRoot() {
        var storage = new LocalFileStorage(temporaryDirectory.toString());

        assertThatThrownBy(() -> storage.delete("../../outside.jpg")).isInstanceOf(IOException.class);
    }
}
