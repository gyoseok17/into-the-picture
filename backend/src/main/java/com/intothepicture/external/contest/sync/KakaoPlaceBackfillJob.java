package com.intothepicture.external.contest.sync;

import com.intothepicture.domain.contest.port.PlaceSearchProvider;
import com.intothepicture.domain.contest.repository.ContestRepository;
import com.intothepicture.domain.contest.location.ContestLocationAvailability;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Persists Kakao keyword-place IDs for every unresolved contest work. It never
 * changes curated coordinates or map codes: an unresolved external place is a
 * normal nullable outcome, not an address fallback.
 */
@Component
public class KakaoPlaceBackfillJob {

    private static final Logger log = LoggerFactory.getLogger(KakaoPlaceBackfillJob.class);
    private static final Map<Long, String> PLACE_QUERY_OVERRIDES = Map.of(
        12L, "나릿골 감성마을",
        30L, "모포항"
    );

    private final ContestRepository contestRepository;
    private final PlaceSearchProvider placeSearchProvider;

    public KakaoPlaceBackfillJob(ContestRepository contestRepository, PlaceSearchProvider placeSearchProvider) {
        this.contestRepository = contestRepository;
        this.placeSearchProvider = placeSearchProvider;
    }

    public KakaoPlaceBackfillResult backfill() {
        var targets = contestRepository.findAllByKakaoPlaceIdIsNull();
        int resolved = 0;
        for (var work : targets) {
            if (ContestLocationAvailability.hasNoReliableLocation(work.getId())) continue;

            String query = PLACE_QUERY_OVERRIDES.getOrDefault(work.getId(), work.getLocation());
            var place = placeSearchProvider.findPlace(query);
            if (place.isEmpty()) continue;
            work.assignKakaoPlaceId(place.get().placeId());
            contestRepository.save(work);
            resolved++;
        }
        var result = new KakaoPlaceBackfillResult(targets.size(), resolved);
        log.info("카카오 장소 ID 보강 완료 — {}", result);
        return result;
    }
}
