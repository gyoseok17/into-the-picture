package com.intothepicture.domain.userphoto.validation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.intothepicture.global.exception.BusinessException;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class ImageUploadValidatorTest {
    private final ImageUploadValidator validator = new ImageUploadValidator();

    @Test
    void acceptsEachSupportedMimeWhenItsMagicBytesMatch() {
        assertThat(validator.validateAndResolveContentType(file("image/jpeg", new byte[] {(byte) 0xff, (byte) 0xd8, (byte) 0xff}))).isEqualTo("image/jpeg");
        assertThat(validator.validateAndResolveContentType(file("image/png", png()))).isEqualTo("image/png");
        assertThat(validator.validateAndResolveContentType(file("image/webp", webp()))).isEqualTo("image/webp");
        assertThat(validator.validateAndResolveContentType(file("image/heic", heif("heic")))).isEqualTo("image/heic");
        assertThat(validator.validateAndResolveContentType(file("image/heif", heif("heic")))).isEqualTo("image/heif");
    }

    @Test
    void rejectsMismatchedMimeAndMagicOrUnsupportedIsoContainer() {
        assertThatThrownBy(() -> validator.validateAndResolveContentType(file("image/png", webp()))).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> validator.validateAndResolveContentType(file("image/heic", heif("avif")))).isInstanceOf(BusinessException.class);
    }

    private MockMultipartFile file(String contentType, byte[] bytes) {
        return new MockMultipartFile("file", "image", contentType, bytes);
    }

    private byte[] png() { return new byte[] {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a}; }

    private byte[] webp() { return "RIFF\u0004\u0000\u0000\u0000WEBP".getBytes(StandardCharsets.US_ASCII); }

    private byte[] heif(String brand) {
        return ("\u0000\u0000\u0000\u0010ftyp" + brand + "\u0000\u0000\u0000\u0000").getBytes(StandardCharsets.ISO_8859_1);
    }
}
