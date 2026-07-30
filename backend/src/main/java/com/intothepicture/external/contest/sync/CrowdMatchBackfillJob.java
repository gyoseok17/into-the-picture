package com.intothepicture.external.contest.sync;

import com.intothepicture.domain.contest.entity.ContestWork;
import com.intothepicture.domain.contest.repository.ContestRepository;
import com.intothepicture.domain.crowd.port.CrowdForecast;
import com.intothepicture.domain.crowd.port.CrowdProvider;
import com.intothepicture.domain.crowd.port.CrowdQuery;
import com.intothepicture.external.contest.parser.LocationParser;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * 집중률 매칭이 안 된 공모전 수상작에 대해 관광지명을 매칭해 crowdAttractionName 을 보강(#7).
 * CrowdProvider port 에만 의존(DIP). 매칭되면 정확한 집중률 관광지명을 저장해두어 이후 /crowd 호출 시
 * 바로 EXACT 로 맞고 crowdAvailable=true 가 된다.
 *
 * <p>매칭 입력 placeNameText 는 촬영지 마지막 조각(장소명) — {@link LocationParser} 재사용.
 * 매칭 실패는 정상(crowdAttractionName null 유지 → 해당 작품은 /crowd 204).
 */
@Component
public class CrowdMatchBackfillJob {

    private static final Logger log = LoggerFactory.getLogger(CrowdMatchBackfillJob.class);

    private final ContestRepository contestRepository;
    private final CrowdProvider crowdProvider;

    public CrowdMatchBackfillJob(ContestRepository contestRepository, CrowdProvider crowdProvider) {
        this.contestRepository = contestRepository;
        this.crowdProvider = crowdProvider;
    }

    public CrowdMatchResult backfill() {
        List<ContestWork> targets = contestRepository.findAll().stream()
            .filter(work -> work.getCrowdAttractionName() == null)
            .toList();
        log.info("집중률 매칭 보강 시작 — 미매칭 {}건", targets.size());

        int matched = 0;
        for (ContestWork work : targets) {
            Optional<CrowdForecast> forecast = crowdProvider.getForecast(toQuery(work));
            if (forecast.isPresent()) {
                work.assignCrowdAttraction(forecast.get().attractionName());
                contestRepository.save(work);
                matched++;
            }
        }

        CrowdMatchResult result = new CrowdMatchResult(targets.size(), matched);
        log.info("집중률 매칭 보강 완료 — {}", result);
        return result;
    }

    private CrowdQuery toQuery(ContestWork work) {
        String placeName = LocationParser.parse(work.getLocation()).placeName();
        return new CrowdQuery(work.getSidoCode(), work.getSigungu(), placeName);
    }
}
