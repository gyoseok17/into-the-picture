package com.intothepicture.domain.contest.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.intothepicture.domain.crowd.port.DailyRate;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class RecommendedDatesCalculatorTest {

    @Test
    void picksLowestRateDates_orderedByDate() {
        LocalDate d26 = LocalDate.of(2026, 6, 26);
        LocalDate d27 = LocalDate.of(2026, 6, 27);
        LocalDate d28 = LocalDate.of(2026, 6, 28);
        LocalDate d29 = LocalDate.of(2026, 6, 29);
        List<DailyRate> daily = List.of(
            new DailyRate(d26, 80.0),
            new DailyRate(d27, 10.0),
            new DailyRate(d28, 50.0),
            new DailyRate(d29, 20.0)
        );

        List<LocalDate> result = RecommendedDatesCalculator.compute(daily, 2);

        // 낮은 rate 2개: d27(10), d29(20) → 날짜 오름차순으로 반환
        assertThat(result).containsExactly(d27, d29);
    }

    @Test
    void returnsEmpty_whenNoData() {
        assertThat(RecommendedDatesCalculator.compute(List.of(), 5)).isEmpty();
    }

    @Test
    void limitsToAvailableSize() {
        List<DailyRate> daily = List.of(
            new DailyRate(LocalDate.of(2026, 6, 26), 30.0),
            new DailyRate(LocalDate.of(2026, 6, 27), 40.0)
        );

        assertThat(RecommendedDatesCalculator.compute(daily, 5)).hasSize(2);
    }
}
