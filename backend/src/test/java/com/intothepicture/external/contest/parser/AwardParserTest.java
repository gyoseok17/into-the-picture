package com.intothepicture.external.contest.parser;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class AwardParserTest {

    @ParameterizedTest
    @CsvSource({
        "'스마트폰 부문 [입선]', '스마트폰 부문', '입선'",
        "'디지털카메라 부문 [대상]', '디지털카메라 부문', '대상'",
        "'드론 부문 [금상]', '드론 부문', '금상'"
    })
    @DisplayName("실측 형식 '{부문} 부문 [{등급}]' 을 부문/등급으로 분리한다")
    void parsesRealFormat(String raw, String division, String grade) {
        Award award = AwardParser.parse(raw);
        assertThat(award.division()).isEqualTo(division);
        assertThat(award.grade()).isEqualTo(grade);
    }

    @Test
    @DisplayName("대괄호 주변 공백 변형을 방어한다")
    void toleratesSpacing() {
        Award award = AwardParser.parse("스마트폰 부문[ 입선 ]");
        assertThat(award.division()).isEqualTo("스마트폰 부문");
        assertThat(award.grade()).isEqualTo("입선");
    }

    @Test
    @DisplayName("전각 대괄호 ［］ 도 처리한다")
    void handlesFullWidthBrackets() {
        Award award = AwardParser.parse("드론 부문 ［은상］");
        assertThat(award.division()).isEqualTo("드론 부문");
        assertThat(award.grade()).isEqualTo("은상");
    }

    @ParameterizedTest
    @ValueSource(strings = {"대상", "부문 없음"})
    @DisplayName("대괄호가 없으면 전체를 부문으로 두고 등급은 null")
    void noBrackets(String raw) {
        Award award = AwardParser.parse(raw);
        assertThat(award.division()).isEqualTo(raw);
        assertThat(award.grade()).isNull();
    }

    @ParameterizedTest
    @NullAndEmptySource
    @DisplayName("null/빈 입력은 (null, null)")
    void nullOrEmpty(String raw) {
        Award award = AwardParser.parse(raw);
        assertThat(award.division()).isNull();
        assertThat(award.grade()).isNull();
    }
}
