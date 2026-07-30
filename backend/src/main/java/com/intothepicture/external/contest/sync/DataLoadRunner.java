package com.intothepicture.external.contest.sync;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * 실데이터 1회 적재 러너(#8): sync(95건) → 지오코딩 보강 → 집중률 매칭 보강을 순서대로 실행.
 * 기본 비활성 — {@code external.dataload.enabled=true} 일 때만 동작(프로파일/플래그 게이트)하므로
 * 일반 부팅/테스트에는 영향이 없다. 실행 예:
 * <pre>./gradlew bootRun --args='--external.dataload.enabled=true'</pre>
 */
@Component
@ConditionalOnProperty(name = "external.dataload.enabled", havingValue = "true")
public class DataLoadRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataLoadRunner.class);

    private final ContestSyncJob contestSyncJob;
    private final GeocodeBackfillJob geocodeBackfillJob;
    private final CrowdMatchBackfillJob crowdMatchBackfillJob;

    public DataLoadRunner(ContestSyncJob contestSyncJob, GeocodeBackfillJob geocodeBackfillJob,
                          CrowdMatchBackfillJob crowdMatchBackfillJob) {
        this.contestSyncJob = contestSyncJob;
        this.geocodeBackfillJob = geocodeBackfillJob;
        this.crowdMatchBackfillJob = crowdMatchBackfillJob;
    }

    @Override
    public void run(String... args) {
        log.info("===== 데이터 적재 시작 (sync → geocode → crowd-match) =====");
        ContestSyncResult sync = contestSyncJob.sync();
        GeocodeBackfillResult geocode = geocodeBackfillJob.backfill();
        CrowdMatchResult crowd = crowdMatchBackfillJob.backfill();
        log.info("===== 데이터 적재 완료 =====");
        log.info("  공모전 sync   : {}", sync);
        log.info("  지오코딩 보강 : {}", geocode);
        log.info("  집중률 매칭   : {}", crowd);
    }
}
