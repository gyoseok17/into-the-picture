package com.intothepicture.external.contest.parser;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;

class SeasonParserTest {

    @ParameterizedTest
    @CsvSource({
        "'가야산 설경, 경상남도 합천군, 겨울, 눈', '겨울'",
        "'가을 산사, 운문사, 단풍, 추경', '가을'",
        "'금성산성의 봄, 벚꽃', '봄'"
    })
    @DisplayName("계절어 토큰을 추출한다(설경/단풍/벚꽃 등 동의어 포함)")
    void extractsDirectAndSynonym(String keywords, String expected) {
        assertThat(SeasonParser.parse(keywords)).isEqualTo(expected);
    }

    @ParameterizedTest
    @CsvSource({
        "'군산 옥녀교차로 청보리밭, 전북특별자치도 군산시, 일몰', '봄'",
        "'제주도 이른 봄의 시작, 송악산, 유채꽃밭', '봄'",
        "'방화수류정의 여름, 경기도 수원시, 수원화성', '여름'",
        "'우포의 가을아침, 경상남도 창녕군, 습지', '가을'",
        "'표충사의 여름, 경상남도 밀양시, 배롱나무', '여름'"
    })
    @DisplayName("제목이 키워드 토큰으로 들어와 계절어/소재를 포함하면 그 계절을 잡는다(실측)")
    void extractsFromTitleToken(String keywords, String expected) {
        assertThat(SeasonParser.parse(keywords)).isEqualTo(expected);
    }

    @Test
    @DisplayName("앞 토큰의 계절 신호가 우선(토큰 순서 = 제목 우선)")
    void firstTokenWins() {
        // 제목 토큰(가을)이 뒤쪽 소재(설경)보다 앞 → 가을
        assertThat(SeasonParser.parse("산정 가을, 어느 산사, 설경")).isEqualTo("가을");
    }

    @Test
    @DisplayName("계절 신호가 없으면 null")
    void noSeason() {
        assertThat(SeasonParser.parse("새해 소원, 서울특별시 영등포구, 선유교, 일출, 해돋이")).isNull();
    }

    @ParameterizedTest
    @NullAndEmptySource
    @DisplayName("null/빈 입력은 null")
    void nullOrEmpty(String raw) {
        assertThat(SeasonParser.parse(raw)).isNull();
    }
}
