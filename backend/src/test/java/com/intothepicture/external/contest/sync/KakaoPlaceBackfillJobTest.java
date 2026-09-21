package com.intothepicture.external.contest.sync;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.intothepicture.domain.contest.entity.ContestWork;
import com.intothepicture.domain.contest.port.PlaceReference;
import com.intothepicture.domain.contest.port.PlaceSearchProvider;
import com.intothepicture.domain.contest.repository.ContestRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class KakaoPlaceBackfillJobTest {

    private final ContestRepository contests = org.mockito.Mockito.mock(ContestRepository.class);
    private final PlaceSearchProvider places = org.mockito.Mockito.mock(PlaceSearchProvider.class);
    private final KakaoPlaceBackfillJob job = new KakaoPlaceBackfillJob(contests, places);

    @Test
    void persistsOnlyResolvedKakaoKeywordPlaceIds() {
        var resolved = org.mockito.Mockito.mock(ContestWork.class);
        var missing = org.mockito.Mockito.mock(ContestWork.class);
        when(resolved.getLocation()).thenReturn("경상남도 합천군, 가야산국립공원");
        when(missing.getLocation()).thenReturn("장소 없음");
        when(contests.findAllByKakaoPlaceIdIsNull()).thenReturn(List.of(resolved, missing));
        when(places.findPlace("경상남도 합천군, 가야산국립공원"))
            .thenReturn(Optional.of(new PlaceReference("18577297", 35.8, 128.1)));
        when(places.findPlace("장소 없음")).thenReturn(Optional.empty());

        assertThat(job.backfill()).isEqualTo(new KakaoPlaceBackfillResult(2, 1));

        verify(resolved).assignKakaoPlaceId("18577297");
        verify(contests).save(resolved);
        verify(missing, org.mockito.Mockito.never()).assignKakaoPlaceId(org.mockito.ArgumentMatchers.anyString());
        verify(contests, org.mockito.Mockito.never()).save(missing);
    }
}
