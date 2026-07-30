package com.intothepicture.external.contest.parser;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;

class LocationParserTest {

    @ParameterizedTest
    @CsvSource({
        "'경상남도 합천군, 가야산국립공원', '경상남도', '합천군', '가야산국립공원'",
        "'경상북도 청도군 운문면, 운문사', '경상북도', '청도군', '운문사'",
        "'울산광역시 동구 일산동, 대왕암공원', '울산광역시', '동구', '대왕암공원'",
        "'서울특별시 강북구, 북한산국립공원', '서울특별시', '강북구', '북한산국립공원'",
        "'경상북도 포항시 남구, 모포항 물통바위', '경상북도', '포항시 남구', '모포항 물통바위'",
        "'경기도 수원시 팔달구, 수원화성 화홍문', '경기도', '수원시 팔달구', '수원화성 화홍문'"
    })
    @DisplayName("'{시도} {시군구}[ {읍면동}], {장소명}' 을 분해한다(시+일반구는 합치고, 그 외엔 첫 시/군/구 토큰)")
    void parsesRealFormat(String location, String sido, String sigungu, String placeName) {
        ParsedLocation parsed = LocationParser.parse(location);
        assertThat(parsed.sido()).isEqualTo(sido);
        assertThat(parsed.sigungu()).isEqualTo(sigungu);
        assertThat(parsed.placeName()).isEqualTo(placeName);
    }

    @Test
    @DisplayName("콤마가 없으면 장소명 = 전체 첫 조각(지오코딩은 어댑터가 폴백 처리)")
    void singleSegment() {
        ParsedLocation parsed = LocationParser.parse("전라남도 강진군");
        assertThat(parsed.sido()).isEqualTo("전라남도");
        assertThat(parsed.sigungu()).isEqualTo("강진군");
        assertThat(parsed.placeName()).isEqualTo("전라남도 강진군");
    }

    @Test
    @DisplayName("시군구 토큰이 없으면 sigungu = null(graceful)")
    void noSigungu() {
        ParsedLocation parsed = LocationParser.parse("세종특별자치시, 어느 공원");
        assertThat(parsed.sido()).isEqualTo("세종특별자치시");
        assertThat(parsed.sigungu()).isNull();
        assertThat(parsed.placeName()).isEqualTo("어느 공원");
    }

    @ParameterizedTest
    @NullAndEmptySource
    @DisplayName("null/빈 입력은 모두 null")
    void nullOrEmpty(String raw) {
        ParsedLocation parsed = LocationParser.parse(raw);
        assertThat(parsed.sido()).isNull();
        assertThat(parsed.sigungu()).isNull();
        assertThat(parsed.placeName()).isNull();
    }
}
