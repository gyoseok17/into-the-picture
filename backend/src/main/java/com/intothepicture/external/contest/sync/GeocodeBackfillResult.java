package com.intothepicture.external.contest.sync;

/** 지오코딩 보강 결과. targets=좌표 없던 건수, geocoded=좌표 확보 성공 건수. */
public record GeocodeBackfillResult(int targets, int geocoded) {

    public String successRate() {
        if (targets == 0) {
            return "대상 없음";
        }
        return String.format("%d/%d (%.0f%%)", geocoded, targets, 100.0 * geocoded / targets);
    }

    @Override
    public String toString() {
        return "GeocodeBackfill[" + successRate() + "]";
    }
}
