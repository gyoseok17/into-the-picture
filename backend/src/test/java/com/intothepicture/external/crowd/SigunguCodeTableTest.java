package com.intothepicture.external.crowd;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** 실제 번들 리소스(sigungu-codes.json)로 해석을 검증한다. */
class SigunguCodeTableTest {

    private final SigunguCodeTable table = new SigunguCodeTable(new ObjectMapper());

    @Test
    @DisplayName("유일한 시군구명은 정확히 해석(합천군 → 48/48890)")
    void resolvesUniqueName() {
        Optional<SigunguCode> code = table.resolve("48", "합천군");
        assertThat(code).isPresent();
        assertThat(code.get().sigunguCd()).isEqualTo("48890");
        assertThat(code.get().areaCd()).isEqualTo("48");
    }

    @Test
    @DisplayName("areaCd 가 오기여도 유일한 이름이면 해석된다(lDongRegnCd 더티 방어)")
    void resolvesUniqueNameDespiteWrongAreaCode() {
        // 합천군은 전국 유일 → areaCd 가 틀려도(99) 이름으로 해석
        Optional<SigunguCode> code = table.resolve("99", "합천군");
        assertThat(code).map(SigunguCode::sigunguCd).contains("48890");
    }

    @Test
    @DisplayName("시+일반구('포항시 남구')도 해석(공백 정규화)")
    void resolvesCityWithGu() {
        assertThat(table.resolve("47", "포항시 남구")).map(SigunguCode::sigunguCd).contains("47111");
        assertThat(table.resolve("47", "포항시  남구")).map(SigunguCode::sigunguCd).contains("47111");
    }

    @Test
    @DisplayName("중복 이름(동구)은 areaCd 로 판별(울산 31 → 31170, 대구 27 → 27140)")
    void disambiguatesDuplicateNameByAreaCode() {
        assertThat(table.resolve("31", "동구")).map(SigunguCode::sigunguCd).contains("31170");
        assertThat(table.resolve("27", "동구")).map(SigunguCode::sigunguCd).contains("27140");
    }

    @Test
    @DisplayName("중복 이름인데 areaCd 가 비면 판별 불가 → empty(graceful)")
    void ambiguousWithoutAreaCode() {
        assertThat(table.resolve("", "동구")).isEmpty();
        assertThat(table.resolve(null, "동구")).isEmpty();
    }

    @Test
    @DisplayName("없는 이름/빈 입력은 empty")
    void unknownOrBlank() {
        assertThat(table.resolve("48", "없는시군구")).isEmpty();
        assertThat(table.resolve("48", "")).isEmpty();
        assertThat(table.resolve("48", null)).isEmpty();
    }
}
