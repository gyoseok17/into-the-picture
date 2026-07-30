package com.intothepicture.external.support;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * 외부 14자리 일시(regDt/mdfcnDt, 예 "20241113160022") → LocalDateTime 변환(순수 함수).
 * 형식이 맞지 않거나 비어 있으면 null(저장 시 외부 메타가 없을 수 있으므로 graceful).
 */
public final class ExternalDateTimes {

    private static final DateTimeFormatter YYYYMMDDHHMMSS = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private ExternalDateTimes() {
    }

    public static LocalDateTime parse14(String raw) {
        if (raw == null) {
            return null;
        }
        String trimmed = raw.strip();
        if (trimmed.length() != 14) {
            return null;
        }
        try {
            return LocalDateTime.parse(trimmed, YYYYMMDDHHMMSS);
        } catch (DateTimeParseException e) {
            return null;
        }
    }
}
