package com.intothepicture.domain.contest.dto;

import com.intothepicture.domain.contest.entity.ContestWork;
import com.intothepicture.domain.crowd.port.CrowdForecast;
import com.intothepicture.global.support.ImageUrls;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/** ContestWork 엔티티·crowd port → 내부 응답 DTO 변환. 외부 필드명 비노출, 이미지 URL https 치환. */
public final class ContestMapper {

    private static final DateTimeFormatter ISO_DATE = DateTimeFormatter.ISO_LOCAL_DATE;

    private ContestMapper() {
    }

    public static ContestSummaryDto toSummary(ContestWork work) {
        return new ContestSummaryDto(
            work.getId(),
            work.getTitle(),
            ImageUrls.toHttps(work.getThumbImageUrl()),
            work.getLocation(),
            work.getSido(),
            work.getSigungu(),
            work.getPhotographer(),
            work.getFilmMonth(),
            work.getAwardDivision(),
            work.getAwardGrade(),
            work.getSeason(),
            keywords(work.getKeywordsRaw())
        );
    }

    public static ContestDetailDto toDetail(ContestWork work) {
        return new ContestDetailDto(
            work.getId(),
            work.getTitle(),
            ImageUrls.toHttps(work.getThumbImageUrl()),
            work.getLocation(),
            work.getSido(),
            work.getSigungu(),
            work.getPhotographer(),
            work.getFilmMonth(),
            work.getAwardDivision(),
            work.getAwardGrade(),
            work.getSeason(),
            keywords(work.getKeywordsRaw()),
            ImageUrls.toHttps(work.getOrgImageUrl()),
            work.getLat(),
            work.getLng(),
            work.getCopyrightCode(),
            work.isCrowdAvailable()
        );
    }

    /** 지도 핀 변환. 좌표(lat/lng)가 둘 다 non-null 인 작품에만 호출된다(getLat/getLng 언박싱 안전). */
    public static ContestMapPinDto toMapPin(ContestWork work) {
        return new ContestMapPinDto(
            work.getId(),
            work.getTitle(),
            ImageUrls.toHttps(work.getThumbImageUrl()),
            work.getLat(),
            work.getLng(),
            work.getAwardGrade(),
            work.getSido()
        );
    }

    public static CrowdForecastDto toCrowdForecast(CrowdForecast forecast, List<LocalDate> recommendedDates) {
        List<CrowdForecastDto.DailyRateDto> daily = forecast.daily().stream()
            .map(rate -> new CrowdForecastDto.DailyRateDto(rate.date().format(ISO_DATE), rate.rate()))
            .toList();
        List<String> recommended = recommendedDates.stream()
            .map(date -> date.format(ISO_DATE))
            .toList();
        return new CrowdForecastDto(
            forecast.attractionName(),
            forecast.areaNm(),
            forecast.sigunguNm(),
            forecast.matchType().name(),
            daily,
            recommended
        );
    }

    /** "a, b, c" → [a, b, c] (공백 트림, 빈 토큰 제거). null/blank → 빈 리스트. */
    static List<String> keywords(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        List<String> result = new ArrayList<>();
        for (String token : raw.split(",")) {
            String trimmed = token.trim();
            if (!trimmed.isEmpty()) {
                result.add(trimmed);
            }
        }
        return result;
    }
}
