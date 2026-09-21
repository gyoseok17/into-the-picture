package com.intothepicture.domain.favorite.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.intothepicture.domain.contest.entity.ContestWork;
import com.intothepicture.domain.contest.repository.ContestRepository;
import com.intothepicture.domain.favorite.entity.Favorite;
import com.intothepicture.domain.favorite.entity.FavoriteTargetType;
import com.intothepicture.domain.favorite.repository.FavoriteRepository;
import com.intothepicture.domain.user.repository.UserRepository;
import java.util.List;
import org.junit.jupiter.api.Test;

class FavoriteServiceTest {
    private final FavoriteRepository favorites = org.mockito.Mockito.mock(FavoriteRepository.class);
    private final ContestRepository contests = org.mockito.Mockito.mock(ContestRepository.class);
    private final FavoriteService service = new FavoriteService(favorites, org.mockito.Mockito.mock(UserRepository.class), contests);

    @Test
    void loadsFavoriteContestsInOneBatchAndPreservesFavoriteOrder() {
        var laterFavorite = org.mockito.Mockito.mock(Favorite.class);
        var earlierFavorite = org.mockito.Mockito.mock(Favorite.class);
        var firstContest = org.mockito.Mockito.mock(ContestWork.class);
        var secondContest = org.mockito.Mockito.mock(ContestWork.class);
        when(laterFavorite.getExternalId()).thenReturn("20");
        when(earlierFavorite.getExternalId()).thenReturn("10");
        when(laterFavorite.getId()).thenReturn(2L);
        when(earlierFavorite.getId()).thenReturn(1L);
        when(firstContest.getId()).thenReturn(20L);
        when(secondContest.getId()).thenReturn(10L);
        when(favorites.findAllByUserIdAndTargetTypeOrderByCreatedAtDesc(1L, FavoriteTargetType.CONTEST))
            .thenReturn(List.of(laterFavorite, earlierFavorite));
        when(contests.findAllByIdIn(List.of(20L, 10L))).thenReturn(List.of(firstContest, secondContest));

        var result = service.favoriteContests(1L);

        assertThat(result).extracting(value -> value.contestId()).containsExactly(20L, 10L);
        verify(contests).findAllByIdIn(List.of(20L, 10L));
        verify(contests, never()).findById(org.mockito.ArgumentMatchers.anyLong());
    }

    @Test
    void skipsDeletedContestReferencesWithoutChangingTheRemainingOrder() {
        var deletedFavorite = org.mockito.Mockito.mock(Favorite.class);
        var activeFavorite = org.mockito.Mockito.mock(Favorite.class);
        var activeContest = org.mockito.Mockito.mock(ContestWork.class);
        when(deletedFavorite.getExternalId()).thenReturn("99");
        when(activeFavorite.getExternalId()).thenReturn("10");
        when(activeFavorite.getId()).thenReturn(1L);
        when(activeContest.getId()).thenReturn(10L);
        when(favorites.findAllByUserIdAndTargetTypeOrderByCreatedAtDesc(1L, FavoriteTargetType.CONTEST))
            .thenReturn(List.of(deletedFavorite, activeFavorite));
        when(contests.findAllByIdIn(List.of(99L, 10L))).thenReturn(List.of(activeContest));

        var result = service.favoriteContests(1L);

        assertThat(result).extracting(value -> value.contestId()).containsExactly(10L);
    }

    @Test
    void doesNotQueryContestsWhenThereAreNoFavorites() {
        when(favorites.findAllByUserIdAndTargetTypeOrderByCreatedAtDesc(1L, FavoriteTargetType.CONTEST)).thenReturn(List.of());

        assertThat(service.favoriteContests(1L)).isEmpty();

        verify(contests, never()).findAllByIdIn(org.mockito.ArgumentMatchers.any());
    }
}
