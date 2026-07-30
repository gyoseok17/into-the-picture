package com.intothepicture.external.crowd;

import com.intothepicture.domain.crowd.port.CrowdForecast;
import com.intothepicture.domain.crowd.port.CrowdProvider;
import com.intothepicture.domain.crowd.port.CrowdQuery;
import com.intothepicture.domain.crowd.port.DailyRate;
import com.intothepicture.external.crowd.AttractionMatcher.AttractionMatch;
import com.intothepicture.global.exception.ExternalApiException;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * 집중률 {@link CrowdProvider} 구현. DIP: 도메인 port 를 구현하는 유일 @Component.
 *
 * <p>흐름: ① 시군구명 → signguCd 해석({@link SigunguCodeTable}) → ② areaCd+signguCd 로 30일 집중률 조회 →
 * ③ 관광지명 부분일치({@link AttractionMatcher})로 해당 관광지 선택 → ④ 그 관광지의 일별 집중률 반환.
 * 코드 해석 실패·관광지 미매칭·외부 오류는 모두 {@link Optional#empty()}(정상 흐름 — 상위에서 204/섹션 숨김).
 * recommendedDates(추천일)는 도메인이 daily 로 계산하므로 여기서는 daily 까지만 채운다.
 */
@Component
public class CrowdRateAdapter implements CrowdProvider {

    private static final Logger log = LoggerFactory.getLogger(CrowdRateAdapter.class);

    private final SigunguCodeTable sigunguCodeTable;
    private final CrowdApiClient crowdApiClient;

    public CrowdRateAdapter(SigunguCodeTable sigunguCodeTable, CrowdApiClient crowdApiClient) {
        this.sigunguCodeTable = sigunguCodeTable;
        this.crowdApiClient = crowdApiClient;
    }

    @Override
    public Optional<CrowdForecast> getForecast(CrowdQuery query) {
        Optional<SigunguCode> code = sigunguCodeTable.resolve(query.sidoCode(), query.sigunguName());
        if (code.isEmpty()) {
            log.debug("시군구 코드 해석 실패(집중률 생략): sido={} sigungu={}", query.sidoCode(), query.sigunguName());
            return Optional.empty();
        }
        try {
            return forecast(code.get(), query.placeNameText());
        } catch (ExternalApiException e) {
            log.warn("집중률 조회 실패(graceful) {}/{}: {}",
                code.get().areaCd(), code.get().sigunguCd(), e.getMessage());
            return Optional.empty();
        }
    }

    private Optional<CrowdForecast> forecast(SigunguCode code, String placeNameText) {
        List<CrowdRow> rows = crowdApiClient.fetch(code.areaCd(), code.sigunguCd());
        if (rows.isEmpty()) {
            return Optional.empty();
        }
        Map<String, List<CrowdRow>> byAttraction = groupByAttraction(rows);
        Optional<AttractionMatch> match = AttractionMatcher.bestMatch(placeNameText, byAttraction.keySet());
        if (match.isEmpty()) {
            log.debug("관광지명 부분일치 실패(집중률 생략): place={} 후보={}", placeNameText, byAttraction.keySet());
            return Optional.empty();
        }
        List<CrowdRow> matchedRows = byAttraction.get(match.get().attractionName());
        return Optional.of(toForecast(match.get(), matchedRows, code));
    }

    private Map<String, List<CrowdRow>> groupByAttraction(List<CrowdRow> rows) {
        Map<String, List<CrowdRow>> grouped = new LinkedHashMap<>();
        for (CrowdRow row : rows) {
            grouped.computeIfAbsent(row.attractionName(), key -> new java.util.ArrayList<>()).add(row);
        }
        return grouped;
    }

    private CrowdForecast toForecast(AttractionMatch match, List<CrowdRow> rows, SigunguCode code) {
        List<DailyRate> daily = rows.stream()
            .sorted(Comparator.comparing(CrowdRow::date))
            .map(row -> new DailyRate(row.date(), row.rate()))
            .toList();
        CrowdRow first = rows.get(0);
        String areaNm = first.areaNm() != null ? first.areaNm() : code.areaNm();
        String sigunguNm = first.sigunguNm() != null ? first.sigunguNm() : code.sigunguNm();
        return new CrowdForecast(match.attractionName(), areaNm, sigunguNm, match.matchType(), daily);
    }
}
