package com.intothepicture.domain.contest.controller;

import com.intothepicture.domain.contest.dto.ContestDetailDto;
import com.intothepicture.domain.contest.dto.ContestSearchCondition;
import com.intothepicture.domain.contest.dto.ContestSummaryDto;
import com.intothepicture.domain.contest.dto.CrowdForecastDto;
import com.intothepicture.domain.contest.dto.FilterOptionsDto;
import com.intothepicture.domain.contest.service.ContestService;
import com.intothepicture.global.response.PageResponse;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** 공모전 수상작 REST API(docs/04 §3). 공개 엔드포인트. 실제 경로는 /api/v1/contests. */
@RestController
@RequestMapping("/contests")
public class ContestController {

    private static final int DEFAULT_SIZE = 20;
    private static final int MAX_SIZE = 100;
    private static final List<String> SORTABLE_FIELDS =
        List.of("id", "filmMonth", "awardGrade", "sigungu", "season");
    private static final Sort DEFAULT_SORT = Sort.by(Sort.Direction.DESC, "id");

    private final ContestService contestService;

    public ContestController(ContestService contestService) {
        this.contestService = contestService;
    }

    @GetMapping
    public PageResponse<ContestSummaryDto> getContests(
        @RequestParam(required = false) String season,
        @RequestParam(required = false) String grade,
        @RequestParam(required = false) String division,
        @RequestParam(required = false) String sido,
        @RequestParam(required = false) String keyword,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String sort
    ) {
        ContestSearchCondition condition = new ContestSearchCondition(season, grade, division, sido, keyword);
        return contestService.getContests(condition, toPageable(page, size, sort));
    }

    @GetMapping("/filters")
    public FilterOptionsDto getFilters() {
        return contestService.getFilterOptions();
    }

    @GetMapping("/{id}")
    public ContestDetailDto getContest(@PathVariable Long id) {
        return contestService.getContest(id);
    }

    @GetMapping("/{id}/crowd")
    public ResponseEntity<CrowdForecastDto> getCrowd(@PathVariable Long id) {
        return contestService.getCrowd(id)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.noContent().build());
    }

    /** page 1-based(첫 페이지=1) → 0-based Pageable. size 상한 적용. sort 화이트리스트(기본 id,desc). */
    private Pageable toPageable(int page, int size, String sort) {
        int pageIndex = Math.max(page, 1) - 1;
        int pageSize = size < 1 ? DEFAULT_SIZE : Math.min(size, MAX_SIZE);
        return PageRequest.of(pageIndex, pageSize, toSort(sort));
    }

    private Sort toSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return DEFAULT_SORT;
        }
        String[] parts = sort.split(",");
        String field = parts[0].trim();
        if (!SORTABLE_FIELDS.contains(field)) {
            return DEFAULT_SORT;
        }
        boolean ascending = parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim());
        return Sort.by(ascending ? Sort.Direction.ASC : Sort.Direction.DESC, field);
    }
}
