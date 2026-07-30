package com.intothepicture.external.crowd;

import static org.assertj.core.api.Assertions.assertThat;

import com.intothepicture.domain.crowd.port.MatchType;
import com.intothepicture.external.crowd.AttractionMatcher.AttractionMatch;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class AttractionMatcherTest {

    @Test
    @DisplayName("공백 제거 후 동일하면 EXACT")
    void exactMatch() {
        Optional<AttractionMatch> match = AttractionMatcher.bestMatch("가야산국립공원", List.of("가야산국립공원"));
        assertThat(match).isPresent();
        assertThat(match.get().attractionName()).isEqualTo("가야산국립공원");
        assertThat(match.get().matchType()).isEqualTo(MatchType.EXACT);
    }

    @Test
    @DisplayName("관광지명이 장소명을 포함하면 PARTIAL(실측: 가야산국립공원 ⊂ 가야산국립공원(홍류동,청량동지구))")
    void partialMatchBySuperset() {
        Optional<AttractionMatch> match = AttractionMatcher.bestMatch(
            "가야산국립공원", List.of("해인사", "가야산국립공원(홍류동,청량동지구)"));
        assertThat(match).isPresent();
        assertThat(match.get().attractionName()).isEqualTo("가야산국립공원(홍류동,청량동지구)");
        assertThat(match.get().matchType()).isEqualTo(MatchType.PARTIAL);
    }

    @Test
    @DisplayName("공백 차이는 정규화로 흡수한다")
    void ignoresWhitespace() {
        Optional<AttractionMatch> match = AttractionMatcher.bestMatch("가야산 국립공원", List.of("가야산국립공원"));
        assertThat(match).map(AttractionMatch::matchType).contains(MatchType.EXACT);
    }

    @Test
    @DisplayName("EXACT 가 PARTIAL 보다 우선, 동률이면 길이차가 작은 후보")
    void prefersExactThenClosest() {
        List<String> candidates = List.of("대왕암공원(테마)", "대왕암공원", "대왕암공원 주차장 일원");
        Optional<AttractionMatch> match = AttractionMatcher.bestMatch("대왕암공원", candidates);
        assertThat(match).isPresent();
        assertThat(match.get().attractionName()).isEqualTo("대왕암공원");
        assertThat(match.get().matchType()).isEqualTo(MatchType.EXACT);
    }

    @Test
    @DisplayName("부분일치 후보가 없으면 empty")
    void noMatch() {
        assertThat(AttractionMatcher.bestMatch("가야산국립공원", List.of("해운대", "광안리"))).isEmpty();
    }

    @Test
    @DisplayName("1글자 장소명은 오매칭 방지를 위해 매칭하지 않는다")
    void tooShort() {
        assertThat(AttractionMatcher.bestMatch("산", List.of("산정호수", "월출산"))).isEmpty();
    }

    @Test
    @DisplayName("null/빈 입력은 empty")
    void nullOrBlank() {
        assertThat(AttractionMatcher.bestMatch(null, List.of("가야산"))).isEmpty();
        assertThat(AttractionMatcher.bestMatch("가야산", null)).isEmpty();
    }
}
