package com.intothepicture.domain.userphoto.metadata;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;

class ImageTakenAtExtractorTest {
    private final ImageTakenAtExtractor extractor = new ImageTakenAtExtractor();

    @Test
    void readsExifOriginalCaptureTime() {
        var result = extractor.extract(new ByteArrayInputStream(jpegWithOriginalTime("2024:05:06 07:08:09")));

        assertThat(result).contains(LocalDateTime.of(2024, 5, 6, 7, 8, 9));
    }

    @Test
    void returnsEmptyWhenTheSupportedContainerHasNoReadableExifTime() {
        assertThat(extractor.extract(new ByteArrayInputStream(minimalPng()))).isEmpty();
        assertThat(extractor.extract(new ByteArrayInputStream(minimalWebp()))).isEmpty();
        assertThat(extractor.extract(new ByteArrayInputStream(minimalHeif()))).isEmpty();
    }

    private byte[] jpegWithOriginalTime(String value) {
        byte[] tiff = new byte[64];
        tiff[0] = 'I'; tiff[1] = 'I'; tiff[2] = 42;
        tiff[4] = 8; tiff[8] = 1;
        tiff[10] = 0x69; tiff[11] = (byte) 0x87;
        tiff[12] = 4; tiff[14] = 1; tiff[18] = 26;
        tiff[26] = 1; tiff[28] = 3; tiff[29] = (byte) 0x90;
        tiff[30] = 2; tiff[32] = 20; tiff[36] = 44;
        System.arraycopy((value + "\0").getBytes(StandardCharsets.US_ASCII), 0, tiff, 44, 20);
        var output = new ByteArrayOutputStream();
        output.writeBytes(new byte[] {(byte) 0xff, (byte) 0xd8, (byte) 0xff, (byte) 0xe1, 0, 72});
        output.writeBytes("Exif\0\0".getBytes(StandardCharsets.US_ASCII));
        output.writeBytes(tiff);
        output.writeBytes(new byte[] {(byte) 0xff, (byte) 0xd9});
        return output.toByteArray();
    }

    private byte[] minimalPng() { return new byte[] {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a}; }

    private byte[] minimalWebp() { return "RIFF\u0004\u0000\u0000\u0000WEBP".getBytes(StandardCharsets.US_ASCII); }

    private byte[] minimalHeif() { return "\u0000\u0000\u0000\u0010ftypheic\u0000\u0000\u0000\u0000".getBytes(StandardCharsets.ISO_8859_1); }
}
