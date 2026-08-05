package com.intothepicture.domain.favorite.controller;

import com.intothepicture.domain.favorite.dto.FavoriteDtos.FavoriteContestDto;
import com.intothepicture.domain.favorite.dto.FavoriteDtos.FavoriteStatusDto;
import com.intothepicture.domain.favorite.service.FavoriteService;
import com.intothepicture.global.security.JwtService.JwtPrincipal;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/me/favorites/contests")
public class FavoriteController {
    private final FavoriteService favoriteService;
    public FavoriteController(FavoriteService favoriteService) { this.favoriteService = favoriteService; }

    @GetMapping public List<FavoriteContestDto> list(@AuthenticationPrincipal JwtPrincipal principal) {
        return favoriteService.favoriteContests(principal.userId());
    }
    @GetMapping("/{contestId}") public FavoriteStatusDto status(@AuthenticationPrincipal JwtPrincipal principal, @PathVariable Long contestId) {
        return favoriteService.contestStatus(principal.userId(), contestId);
    }
    @PostMapping("/{contestId}") public FavoriteStatusDto add(@AuthenticationPrincipal JwtPrincipal principal, @PathVariable Long contestId) {
        return favoriteService.addContest(principal.userId(), contestId);
    }
    @DeleteMapping("/{contestId}") public ResponseEntity<Void> remove(@AuthenticationPrincipal JwtPrincipal principal, @PathVariable Long contestId) {
        favoriteService.removeContest(principal.userId(), contestId);
        return ResponseEntity.noContent().build();
    }
}
