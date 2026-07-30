package com.intothepicture.domain.contest.service;

import com.intothepicture.domain.crowd.port.DailyRate;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

/**
 * 30일 일별 집중률에서 혼잡도가 낮은 추천일을 계산(rate 오름차순 상위 N일 → 날짜순 정렬).
 * provider 는 daily 만 반환하고 추천일 산출은 도메인 책임(계약 §3).
 */
public final class RecommendedDatesCalculator {

    private RecommendedDatesCalculator() {
    }

    public static List<LocalDate> compute(List<DailyRate> daily, int limit) {
        if (daily == null || daily.isEmpty() || limit <= 0) {
            return List.of();
        }
        return daily.stream()
            .sorted(Comparator.comparingDouble(DailyRate::rate).thenComparing(DailyRate::date))
            .limit(limit)
            .map(DailyRate::date)
            .sorted()
            .toList();
    }
}
