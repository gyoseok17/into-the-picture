package com.intothepicture.external.contest.sync;

/**
 * 공모전 sync 실행 결과 요약. fetched=외부에서 받은 건수, inserted=신규 저장, skipped=이미 존재(insert-if-absent).
 */
public record ContestSyncResult(int fetched, int inserted, int skipped) {

    @Override
    public String toString() {
        return "ContestSync[fetched=" + fetched + ", inserted=" + inserted + ", skipped=" + skipped + "]";
    }
}
