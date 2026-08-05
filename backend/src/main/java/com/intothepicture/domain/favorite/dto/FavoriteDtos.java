package com.intothepicture.domain.favorite.dto;

import com.intothepicture.domain.contest.dto.ContestSummaryDto;
import java.time.LocalDateTime;

public final class FavoriteDtos {
    private FavoriteDtos() {}

    public record FavoriteStatusDto(boolean favorite) {}

    public record FavoriteContestDto(Long favoriteId, Long contestId, ContestSummaryDto contest, LocalDateTime createdAt) {}
}
