package com.intothepicture.domain.crowd.controller;

import com.intothepicture.domain.contest.dto.CrowdForecastDto;
import com.intothepicture.domain.contest.dto.ContestMapper;
import com.intothepicture.domain.contest.dto.ContestSummaryDto;
import com.intothepicture.domain.contest.service.RecommendedDatesCalculator;
import com.intothepicture.domain.contest.service.ContestService;
import com.intothepicture.domain.crowd.port.CrowdProvider;
import com.intothepicture.domain.crowd.port.CrowdRegion;
import com.intothepicture.domain.crowd.port.CrowdSigungu;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** 독립 혼잡도 탐색: 지역 → 시군구 → 관광지 → 향후 30일 예측. */
@RestController
@RequestMapping("/crowd")
public class CrowdController {

    private static final int RECOMMENDED_DATE_LIMIT = 5;
    private final CrowdProvider crowdProvider;
    private final ContestService contestService;

    public CrowdController(CrowdProvider crowdProvider, ContestService contestService) {
        this.crowdProvider = crowdProvider;
        this.contestService = contestService;
    }

    @GetMapping("/regions")
    public List<CrowdRegion> regions() {
        return crowdProvider.regions();
    }

    @GetMapping("/sigungu")
    public List<CrowdSigungu> sigungus(@RequestParam String areaCd) {
        return crowdProvider.sigungus(areaCd);
    }

    @GetMapping("/attractions")
    public List<String> attractions(@RequestParam String areaCd, @RequestParam String sigunguCd) {
        return crowdProvider.attractions(areaCd, sigunguCd);
    }

    @GetMapping("/contests")
    public List<ContestSummaryDto> relatedContests(@RequestParam String attraction) {
        return contestService.findRelatedToAttraction(attraction);
    }

    @GetMapping
    public ResponseEntity<CrowdForecastDto> forecast(
        @RequestParam String areaCd,
        @RequestParam String sigunguCd,
        @RequestParam String attraction
    ) {
        return crowdProvider.getForecast(areaCd, sigunguCd, attraction)
            .map(value -> ContestMapper.toCrowdForecast(
                value, RecommendedDatesCalculator.compute(value.daily(), RECOMMENDED_DATE_LIMIT)))
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
