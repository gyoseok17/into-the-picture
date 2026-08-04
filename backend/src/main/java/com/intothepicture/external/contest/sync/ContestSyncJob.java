package com.intothepicture.external.contest.sync;

import com.intothepicture.domain.contest.entity.ContestWork;
import com.intothepicture.domain.contest.repository.ContestRepository;
import com.intothepicture.external.contest.client.ContestApiClient;
import com.intothepicture.external.contest.dto.ContestApiItem;
import com.intothepicture.external.contest.parser.Award;
import com.intothepicture.external.contest.parser.AwardParser;
import com.intothepicture.external.contest.parser.LocationParser;
import com.intothepicture.external.contest.parser.ParsedLocation;
import com.intothepicture.external.contest.parser.SeasonParser;
import java.time.LocalDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * 공모전 수상작 동기화. 외부 95건을 받아 원문 + 파싱값(부문/등급/계절/시도/시군구)을 함께 저장한다.
 *
 * <p>저장 정책은 <b>insert-if-absent</b>: {@code contentId} 가 이미 있으면 건너뛴다. ContestWork 가
 * 원문 필드 write-once(빌더 전용)로 설계돼 있고 수상작 95건은 고정 참조데이터이기 때문이다.
 * 보강 필드(lat/lng, crowdAttractionName)는 별도 배치(#6/#7)가 채운다.
 *
 * <p>외부 HTTP 호출은 트랜잭션 밖에서 수행하고 저장은 행별 repository 호출(각자 트랜잭션)로 처리해
 * 느린 IO 동안 DB 트랜잭션을 잡지 않는다.
 */
@Component
public class ContestSyncJob {

    private static final Logger log = LoggerFactory.getLogger(ContestSyncJob.class);

    private final ContestApiClient contestApiClient;
    private final ContestRepository contestRepository;

    public ContestSyncJob(ContestApiClient contestApiClient, ContestRepository contestRepository) {
        this.contestApiClient = contestApiClient;
        this.contestRepository = contestRepository;
    }

    public ContestSyncResult sync() {
        List<ContestApiItem> items = contestApiClient.fetchAll();
        log.info("공모전 sync 시작 — 외부 {}건 수신", items.size());

        int inserted = 0;
        int skipped = 0;
        for (ContestApiItem item : items) {
            if (item.contentId() == null) {
                log.warn("contentId 없는 항목 건너뜀: {}", item.title());
                skipped++;
                continue;
            }
            if (contestRepository.existsByContentId(item.contentId())) {
                skipped++;
                continue;
            }
            contestRepository.save(toEntity(item));
            inserted++;
        }

        ContestSyncResult result = new ContestSyncResult(items.size(), inserted, skipped);
        log.info("공모전 sync 완료 — {}", result);
        return result;
    }

    private ContestWork toEntity(ContestApiItem item) {
        Award award = AwardParser.parse(item.awardRaw());
        String locationText = ContestLocationOverrides.apply(item.title(), item.location());
        ParsedLocation location = LocationParser.parse(locationText);
        String season = SeasonParser.parse(item.keywordsRaw());

        return ContestWork.builder()
            .contentId(item.contentId())
            .title(item.title())
            .titleEn(item.titleEn())
            .location(locationText)
            .locationEn(item.locationEn())
            .sidoCode(item.sidoCode())
            .sido(location.sido())
            .sigungu(location.sigungu())
            .photographer(item.photographer())
            .photographerEn(item.photographerEn())
            .filmMonth(item.filmMonth())
            .awardRaw(item.awardRaw())
            .awardDivision(award.division())
            .awardGrade(award.grade())
            .keywordsRaw(item.keywordsRaw())
            .season(season)
            .orgImageUrl(item.orgImageUrl())
            .thumbImageUrl(item.thumbImageUrl())
            .copyrightCode(item.copyrightCode())
            .externalRegDt(item.externalRegDt())
            .externalMdfcnDt(item.externalMdfcnDt())
            .syncedAt(LocalDateTime.now())
            .build();
    }
}
