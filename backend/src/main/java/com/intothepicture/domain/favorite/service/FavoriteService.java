package com.intothepicture.domain.favorite.service;

import com.intothepicture.domain.contest.dto.ContestMapper;
import com.intothepicture.domain.contest.entity.ContestWork;
import com.intothepicture.domain.contest.repository.ContestRepository;
import com.intothepicture.domain.favorite.dto.FavoriteDtos.FavoriteContestDto;
import com.intothepicture.domain.favorite.dto.FavoriteDtos.FavoriteStatusDto;
import com.intothepicture.domain.favorite.entity.Favorite;
import com.intothepicture.domain.favorite.entity.FavoriteSource;
import com.intothepicture.domain.favorite.entity.FavoriteTargetType;
import com.intothepicture.domain.favorite.repository.FavoriteRepository;
import com.intothepicture.domain.user.repository.UserRepository;
import com.intothepicture.global.exception.BusinessException;
import com.intothepicture.global.exception.ErrorCode;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** M5: 수상작 하트 저장. 사진·관광지 저장은 같은 Favorite 테이블을 확장해 추가한다. */
@Service
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final ContestRepository contestRepository;

    public FavoriteService(FavoriteRepository favoriteRepository, UserRepository userRepository, ContestRepository contestRepository) {
        this.favoriteRepository = favoriteRepository;
        this.userRepository = userRepository;
        this.contestRepository = contestRepository;
    }

    @Transactional(readOnly = true)
    public FavoriteStatusDto contestStatus(Long userId, Long contestId) {
        return new FavoriteStatusDto(findContestFavorite(userId, contestId).isPresent());
    }

    @Transactional
    public FavoriteStatusDto addContest(Long userId, Long contestId) {
        if (findContestFavorite(userId, contestId).isPresent()) return new FavoriteStatusDto(true);
        ContestWork contest = contestRepository.findById(contestId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        Favorite favorite = Favorite.builder()
            .user(userRepository.findById(userId).orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED)))
            .targetType(FavoriteTargetType.CONTEST)
            .source(FavoriteSource.CONTEST)
            .externalId(contestId.toString())
            .snapshotTitle(contest.getTitle())
            .snapshotImageUrl(contest.getThumbImageUrl())
            .build();
        favoriteRepository.save(favorite);
        return new FavoriteStatusDto(true);
    }

    @Transactional
    public void removeContest(Long userId, Long contestId) {
        favoriteRepository.deleteByUserIdAndTargetTypeAndExternalId(userId, FavoriteTargetType.CONTEST, contestId.toString());
    }

    @Transactional(readOnly = true)
    public List<FavoriteContestDto> favoriteContests(Long userId) {
        var favorites = favoriteRepository.findAllByUserIdAndTargetTypeOrderByCreatedAtDesc(userId, FavoriteTargetType.CONTEST);
        var contestIds = favorites.stream()
                .map(this::contestId)
                .flatMap(java.util.Optional::stream)
                .distinct()
                .toList();
        Map<Long, ContestWork> contestsById = contestIds.isEmpty() ? Map.of() : contestRepository.findAllByIdIn(contestIds)
            .stream().collect(java.util.stream.Collectors.toMap(ContestWork::getId, Function.identity()));
        return favorites.stream()
            .map(favorite -> toContestDto(favorite, contestsById))
            .flatMap(java.util.Optional::stream)
            .toList();
    }

    private java.util.Optional<FavoriteContestDto> toContestDto(Favorite favorite, Map<Long, ContestWork> contestsById) {
        return contestId(favorite)
            .map(contestsById::get)
            .map(contest -> new FavoriteContestDto(favorite.getId(), contest.getId(), ContestMapper.toSummary(contest), favorite.getCreatedAt()));
    }

    private java.util.Optional<Long> contestId(Favorite favorite) {
        try { return java.util.Optional.of(Long.valueOf(favorite.getExternalId())); }
        catch (NumberFormatException ignored) { return java.util.Optional.empty(); }
    }

    private java.util.Optional<Favorite> findContestFavorite(Long userId, Long contestId) {
        return favoriteRepository.findByUserIdAndTargetTypeAndExternalId(userId, FavoriteTargetType.CONTEST, contestId.toString());
    }
}
