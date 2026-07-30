package com.intothepicture.external.contest.sync;

/** 집중률 매칭 보강 결과. targets=미매칭 건수, matched=관광지 매칭 성공 건수. */
public record CrowdMatchResult(int targets, int matched) {

    public String matchRate() {
        if (targets == 0) {
            return "대상 없음";
        }
        return String.format("%d/%d (%.0f%%)", matched, targets, 100.0 * matched / targets);
    }

    @Override
    public String toString() {
        return "CrowdMatch[" + matchRate() + "]";
    }
}
