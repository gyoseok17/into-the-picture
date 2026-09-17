package com.intothepicture.domain.favorite.repository;

import com.intothepicture.domain.favorite.entity.Favorite;
import com.intothepicture.domain.favorite.entity.FavoriteTargetType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    Optional<Favorite> findByUserIdAndTargetTypeAndExternalId(Long userId, FavoriteTargetType targetType, String externalId);

    boolean existsByUserIdAndTargetTypeAndExternalId(Long userId, FavoriteTargetType targetType, String externalId);

    List<Favorite> findAllByUserIdAndTargetTypeOrderByCreatedAtDesc(Long userId, FavoriteTargetType targetType);

    void deleteByUserIdAndTargetTypeAndExternalId(Long userId, FavoriteTargetType targetType, String externalId);
}
