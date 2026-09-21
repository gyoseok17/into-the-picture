package com.intothepicture.domain.contest.service;

import com.intothepicture.domain.contest.dto.ContestDetailDto;
import com.intothepicture.domain.contest.dto.ContestMapPinDto;
import com.intothepicture.domain.contest.dto.ContestMapper;
import com.intothepicture.domain.contest.location.ContestLocationAvailability;
import com.intothepicture.domain.contest.dto.ContestSearchCondition;
import com.intothepicture.domain.contest.dto.ContestSummaryDto;
import com.intothepicture.domain.contest.dto.CrowdForecastDto;
import com.intothepicture.domain.contest.dto.FilterOptionsDto;
import com.intothepicture.domain.contest.entity.ContestWork;
import com.intothepicture.domain.contest.port.GeocodingProvider;
import com.intothepicture.domain.contest.repository.ContestRepository;
import com.intothepicture.domain.contest.repository.ContestSpecifications;
import com.intothepicture.domain.crowd.port.CrowdForecast;
import com.intothepicture.domain.crowd.port.CrowdProvider;
import com.intothepicture.domain.crowd.port.CrowdQuery;
import com.intothepicture.global.exception.BusinessException;
import com.intothepicture.global.exception.ErrorCode;
import com.intothepicture.global.response.PageResponse;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 공모전 수상작 조회 도메인. 외부 데이터는 GeocodingProvider/CrowdProvider port 로만 접근(DIP).
 * provider 가 아직 주입되지 않은 환경(external 미투입)에서도 graceful 하게 동작(좌표 null / 집중률 204).
 */
@Service
public class ContestService {

    private static final int RECOMMENDED_DATE_LIMIT = 5;
    private static final List<String> SEASON_ORDER = List.of("봄", "여름", "가을", "겨울");

    private final ContestRepository contestRepository;
    private final Optional<GeocodingProvider> geocodingProvider;
    private final Optional<CrowdProvider> crowdProvider;

    public ContestService(ContestRepository contestRepository,
                          Optional<GeocodingProvider> geocodingProvider,
                          Optional<CrowdProvider> crowdProvider) {
        this.contestRepository = contestRepository;
        this.geocodingProvider = geocodingProvider;
        this.crowdProvider = crowdProvider;
    }

    @Transactional(readOnly = true)
    public PageResponse<ContestSummaryDto> getContests(ContestSearchCondition condition, Pageable pageable) {
        Page<ContestSummaryDto> page = contestRepository
            .findAll(ContestSpecifications.from(condition), pageable)
            .map(ContestMapper::toSummary);
        return PageResponse.from(page);
    }

    /**
     * 지도 뷰용: 목록과 동일한 필터 + 좌표 non-null 조건. 페이지네이션 없이 전체를 배열로.
     * 필터 규칙은 목록과 같은 {@link ContestSpecifications#from} 재사용(중복 구현 금지).
     */
    @Transactional(readOnly = true)
    public List<ContestMapPinDto> findMapPins(ContestSearchCondition condition) {
        return contestRepository
            .findAll(ContestSpecifications.from(condition).and(ContestSpecifications.hasCoordinates()))
            .stream()
            .map(ContestMapper::toMapPin)
            .toList();
    }

    /** 혼잡도 탭에서 선택한 관광지와 관련 있는 수상작(최대 3건)을 사진 탐색용으로 제공한다. */
    @Transactional(readOnly = true)
    public List<ContestSummaryDto> findRelatedToAttraction(String attractionName) {
        if (attractionName == null || attractionName.isBlank()) {
            return List.of();
        }
        return contestRepository.findAll().stream()
            .filter(work -> matchesAttraction(work, attractionName))
            .sorted(Comparator.comparing(ContestWork::getId).reversed())
            .limit(3)
            .map(ContestMapper::toSummary)
            .toList();
    }

    @Transactional(readOnly = true)
    public FilterOptionsDto getFilterOptions() {
        return new FilterOptionsDto(
            orderedSeasons(contestRepository.findDistinctSeasons()),
            contestRepository.findDistinctGrades(),
            contestRepository.findDistinctDivisions(),
            contestRepository.findDistinctSidos()
        );
    }

    /** 상세. 좌표가 없으면 GeocodingProvider 로 on-demand 조회 후 저장(캐시 — dirty checking). */
    @Transactional
    public ContestDetailDto getContest(Long id) {
        ContestWork work = findWork(id);
        if (!ContestLocationAvailability.hasNoReliableLocation(work.getId()) && !work.hasCoordinates()) {
            geocodingProvider
                .flatMap(provider -> provider.geocode(work.getLocation()))
                .ifPresent(coordinate -> work.assignCoordinates(coordinate.lat(), coordinate.lng()));
        }
        return ContestMapper.toDetail(work);
    }

    /** 이 수상작 장소의 집중률. 매칭 실패(또는 provider 부재) 시 Optional.empty() → 컨트롤러가 204. */
    @Transactional(readOnly = true)
    public Optional<CrowdForecastDto> getCrowd(Long id) {
        ContestWork work = findWork(id);
        if (crowdProvider.isEmpty()) {
            return Optional.empty();
        }
        CrowdQuery query = new CrowdQuery(work.getSidoCode(), work.getSigungu(), crowdPlaceName(work));
        return crowdProvider.get().getForecast(query).map(this::toForecastDto);
    }

    private CrowdForecastDto toForecastDto(CrowdForecast forecast) {
        List<LocalDate> recommended = RecommendedDatesCalculator.compute(forecast.daily(), RECOMMENDED_DATE_LIMIT);
        return ContestMapper.toCrowdForecast(forecast, recommended);
    }

    private ContestWork findWork(Long id) {
        return contestRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
    }

    /** 집중률 매칭 입력: crowdAttractionName 우선, 없으면 촬영지 텍스트의 마지막 조각(장소명). */
    private String crowdPlaceName(ContestWork work) {
        if (work.getCrowdAttractionName() != null) {
            return work.getCrowdAttractionName();
        }
        return lastSegment(work.getLocation());
    }

    private String lastSegment(String location) {
        if (location == null || location.isBlank()) {
            return location;
        }
        String[] parts = location.split("[,/]");
        return parts[parts.length - 1].trim();
    }

    private boolean matchesAttraction(ContestWork work, String attractionName) {
        List<String> candidates = new java.util.ArrayList<>();
        candidates.add(lastSegment(work.getLocation()));
        candidates.add(work.getCrowdAttractionName());
        if (work.getKeywordsRaw() != null) {
            for (String keyword : work.getKeywordsRaw().split(",")) {
                candidates.add(keyword.trim());
            }
        }
        return candidates.stream().anyMatch(candidate -> namesOverlap(candidate, attractionName));
    }

    private boolean namesOverlap(String left, String right) {
        String normalizedLeft = normalizeName(left);
        String normalizedRight = normalizeName(right);
        return normalizedLeft.length() >= 2 && normalizedRight.length() >= 2
            && (normalizedLeft.equals(normalizedRight)
                || normalizedLeft.contains(normalizedRight)
                || normalizedRight.contains(normalizedLeft));
    }

    private String normalizeName(String name) {
        return name == null ? "" : name.replaceAll("\\s+", "");
    }

    /** 계절 필터 옵션을 봄·여름·가을·겨울 순으로 정렬(그 외 값은 뒤로). */
    private List<String> orderedSeasons(List<String> seasons) {
        return seasons.stream()
            .sorted(Comparator.comparingInt(this::seasonRank))
            .toList();
    }

    private int seasonRank(String season) {
        int index = SEASON_ORDER.indexOf(season);
        return index >= 0 ? index : Integer.MAX_VALUE;
    }
}
