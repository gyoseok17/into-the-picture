package com.intothepicture.domain.userphoto.validation;

import com.intothepicture.global.exception.BusinessException;
import com.intothepicture.global.exception.ErrorCode;
import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

/** MIME 주장과 파일 서명이 모두 일치할 때만 지원 형식으로 취급한다. */
@Component
public class ImageUploadValidator {
    public static final long MAX_FILE_SIZE = 10 * 1024 * 1024;
    private static final int HEADER_SIZE = 4096;

    public String validateAndResolveContentType(MultipartFile file) {
        if (file == null || file.isEmpty() || file.getSize() > MAX_FILE_SIZE) throw invalidImage();
        String requestContentType = normalizedContentType(file.getContentType());
        ImageFormat detected = detect(file);
        if (detected == null || !detected.accepts(requestContentType)) throw invalidImage();
        return detected.contentTypeFor(requestContentType);
    }

    private ImageFormat detect(MultipartFile file) {
        try (InputStream input = file.getInputStream()) {
            return ImageFormat.detect(input.readNBytes(HEADER_SIZE));
        } catch (IOException ignored) {
            return null;
        }
    }

    private String normalizedContentType(String contentType) {
        if (contentType == null) return "";
        return contentType.split(";", 2)[0].strip().toLowerCase(Locale.ROOT);
    }

    private BusinessException invalidImage() {
        return new BusinessException(ErrorCode.INVALID_REQUEST, "JPEG, PNG, WebP, HEIC, HEIF images up to 10MB are supported.");
    }
}
