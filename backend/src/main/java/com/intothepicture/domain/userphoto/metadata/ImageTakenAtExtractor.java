package com.intothepicture.domain.userphoto.metadata;

import com.drew.imaging.ImageMetadataReader;
import com.drew.imaging.ImageProcessingException;
import com.drew.metadata.Directory;
import com.drew.metadata.exif.ExifIFD0Directory;
import com.drew.metadata.exif.ExifSubIFDDirectory;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Optional;
import org.springframework.stereotype.Component;

/**
 * metadata-extractor가 지원하는 JPEG/PNG/WebP/HEIF 컨테이너에서 EXIF 촬영 시각만 읽는다.
 * GPS와 그 밖의 사진 메타데이터는 조회하지 않는다.
 */
@Component
public class ImageTakenAtExtractor {
    private static final DateTimeFormatter EXIF_DATE_TIME = DateTimeFormatter.ofPattern("yyyy:MM:dd HH:mm:ss");

    public Optional<LocalDateTime> extract(InputStream input) {
        try {
            var metadata = ImageMetadataReader.readMetadata(input);
            return value(metadata.getFirstDirectoryOfType(ExifSubIFDDirectory.class), ExifSubIFDDirectory.TAG_DATETIME_ORIGINAL)
                .or(() -> value(metadata.getFirstDirectoryOfType(ExifIFD0Directory.class), ExifIFD0Directory.TAG_DATETIME))
                .flatMap(this::parse);
        } catch (ImageProcessingException | IOException ignored) {
            return Optional.empty();
        }
    }

    private Optional<String> value(Directory directory, int tag) {
        return directory == null ? Optional.empty() : Optional.ofNullable(directory.getString(tag));
    }

    private Optional<LocalDateTime> parse(String value) {
        try {
            return Optional.of(LocalDateTime.parse(value.strip(), EXIF_DATE_TIME));
        } catch (DateTimeParseException ignored) {
            return Optional.empty();
        }
    }
}
