package com.intothepicture.external.contest.sync;

import com.intothepicture.domain.contest.entity.ContestWork;
import com.intothepicture.domain.contest.port.Coordinate;
import com.intothepicture.domain.contest.port.GeocodingProvider;
import com.intothepicture.domain.contest.repository.ContestRepository;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * 좌표가 없는 공모전 수상작에 카카오 지오코딩으로 lat/lng 를 일괄 보강(#6).
 * GeocodingProvider port 에만 의존(DIP) — 어댑터 교체에 영향받지 않는다.
 *
 * <p>좌표 확보 실패는 정상 흐름(좌표 null 유지). 95건 규모라 findAll 후 메모리 필터로 충분하다.
 */
@Component
public class GeocodeBackfillJob {

    private static final Logger log = LoggerFactory.getLogger(GeocodeBackfillJob.class);

    private final ContestRepository contestRepository;
    private final GeocodingProvider geocodingProvider;

    public GeocodeBackfillJob(ContestRepository contestRepository, GeocodingProvider geocodingProvider) {
        this.contestRepository = contestRepository;
        this.geocodingProvider = geocodingProvider;
    }

    public GeocodeBackfillResult backfill() {
        List<ContestWork> targets = contestRepository.findAll().stream()
            .filter(work -> !work.hasCoordinates())
            .toList();
        log.info("지오코딩 보강 시작 — 좌표 없는 {}건", targets.size());

        int geocoded = 0;
        for (ContestWork work : targets) {
            Optional<Coordinate> coordinate = geocodingProvider.geocode(work.getLocation());
            if (coordinate.isPresent()) {
                work.assignCoordinates(coordinate.get().lat(), coordinate.get().lng());
                contestRepository.save(work);
                geocoded++;
            } else {
                log.debug("지오코딩 실패(좌표 null 유지): {}", work.getLocation());
            }
        }

        GeocodeBackfillResult result = new GeocodeBackfillResult(targets.size(), geocoded);
        log.info("지오코딩 보강 완료 — {}", result);
        return result;
    }
}
