package com.intothepicture.external.contest.sync;

/** Kakao place-ID enrichment outcome; unresolved locations intentionally remain null. */
public record KakaoPlaceBackfillResult(int targets, int resolved) {

    @Override
    public String toString() {
        return "KakaoPlaceBackfill[" + resolved + "/" + targets + "]";
    }
}
