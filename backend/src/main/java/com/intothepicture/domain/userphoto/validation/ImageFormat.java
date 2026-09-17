package com.intothepicture.domain.userphoto.validation;

import java.util.Locale;
import java.util.Set;

enum ImageFormat {
    JPEG("image/jpeg", Set.of("image/jpeg")),
    PNG("image/png", Set.of("image/png")),
    WEBP("image/webp", Set.of("image/webp")),
    HEIF("image/heif", Set.of("image/heic", "image/heif"));

    private static final Set<String> HEIF_BRANDS = Set.of("heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs");
    private final String contentType;
    private final Set<String> acceptedContentTypes;

    ImageFormat(String contentType, Set<String> acceptedContentTypes) {
        this.contentType = contentType;
        this.acceptedContentTypes = acceptedContentTypes;
    }

    String contentTypeFor(String requestContentType) {
        // HEIC and HEIF are separate browser media types for the same validated container family.
        return this == HEIF ? requestContentType : contentType;
    }

    boolean accepts(String requestContentType) { return acceptedContentTypes.contains(requestContentType); }

    static ImageFormat detect(byte[] header) {
        if (isJpeg(header)) return JPEG;
        if (isPng(header)) return PNG;
        if (isWebp(header)) return WEBP;
        if (isHeif(header)) return HEIF;
        return null;
    }

    private static boolean isJpeg(byte[] bytes) {
        return bytes.length >= 3 && unsigned(bytes[0]) == 0xff && unsigned(bytes[1]) == 0xd8 && unsigned(bytes[2]) == 0xff;
    }

    private static boolean isPng(byte[] bytes) {
        return bytes.length >= 8 && unsigned(bytes[0]) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4e && bytes[3] == 0x47
            && bytes[4] == 0x0d && bytes[5] == 0x0a && bytes[6] == 0x1a && bytes[7] == 0x0a;
    }

    private static boolean isWebp(byte[] bytes) {
        return bytes.length >= 12 && asciiAt(bytes, 0, "RIFF") && asciiAt(bytes, 8, "WEBP");
    }

    private static boolean isHeif(byte[] bytes) {
        if (bytes.length < 16 || !asciiAt(bytes, 4, "ftyp")) return false;
        long boxSize = unsignedInt(bytes, 0);
        if (boxSize < 16 || boxSize > bytes.length) return false;
        boolean genericMif = false;
        boolean avif = false;
        for (int offset = 8; offset + 4 <= boxSize; offset += 4) {
            String brand = ascii(bytes, offset, 4).toLowerCase(Locale.ROOT);
            if (HEIF_BRANDS.contains(brand)) return true;
            if ("mif1".equals(brand)) genericMif = true;
            if ("avif".equals(brand) || "avis".equals(brand)) avif = true;
        }
        // Generic MIAF is accepted only when it is not identified as AVIF.
        return genericMif && !avif;
    }

    private static boolean asciiAt(byte[] bytes, int offset, String value) {
        return bytes.length >= offset + value.length() && ascii(bytes, offset, value.length()).equals(value);
    }

    private static String ascii(byte[] bytes, int offset, int length) {
        return new String(bytes, offset, length, java.nio.charset.StandardCharsets.US_ASCII);
    }

    private static long unsignedInt(byte[] bytes, int offset) {
        return ((long) unsigned(bytes[offset]) << 24) | ((long) unsigned(bytes[offset + 1]) << 16)
            | ((long) unsigned(bytes[offset + 2]) << 8) | unsigned(bytes[offset + 3]);
    }

    private static int unsigned(byte value) { return value & 0xff; }
}
