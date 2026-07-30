package com.intothepicture.external.support;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class ExternalDateTimesTest {

    @Test
    @DisplayName("14자리 yyyyMMddHHmmss 를 LocalDateTime 으로 변환")
    void parses14Digits() {
        assertThat(ExternalDateTimes.parse14("20241113160022"))
            .isEqualTo(LocalDateTime.of(2024, 11, 13, 16, 0, 22));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"2024111316", "abcdefghijklmn", "20241332999999", " "})
    @DisplayName("null/길이 불일치/비정상 값은 null(graceful)")
    void invalidReturnsNull(String raw) {
        assertThat(ExternalDateTimes.parse14(raw)).isNull();
    }
}
