package com.intothepicture.external.crowd;

import com.intothepicture.domain.crowd.port.MatchType;
import java.util.Collection;
import java.util.Optional;

/**
 * 촬영지 장소명 ↔ 집중률 관광지명 부분일치(순수 함수). 두 이름은 정확히 일치하지 않는다
 * (예: "가야산국립공원" vs "가야산국립공원(홍류동,청량동지구)"). 공백 제거 후 동일하면 EXACT,
 * 한쪽이 다른 쪽을 포함하면 PARTIAL 로 본다. 후보 중 EXACT 우선, 그다음 이름 길이차가 작은 것을 택한다.
 *
 * <p>너무 짧은 장소명(1글자)은 오매칭을 막기 위해 매칭하지 않는다.
 */
public final class AttractionMatcher {

    private static final int MIN_LENGTH = 2;

    /** 매칭된 관광지명(후보의 원문)과 매칭 방식. */
    public record AttractionMatch(String attractionName, MatchType matchType) {
    }

    private AttractionMatcher() {
    }

    public static Optional<AttractionMatch> bestMatch(String placeNameText, Collection<String> candidates) {
        String place = normalize(placeNameText);
        if (place.length() < MIN_LENGTH || candidates == null) {
            return Optional.empty();
        }
        AttractionMatch best = null;
        int bestScore = Integer.MAX_VALUE;
        int bestLenDiff = Integer.MAX_VALUE;
        for (String candidate : candidates) {
            String norm = normalize(candidate);
            MatchType type = classify(place, norm);
            if (type == null) {
                continue;
            }
            int score = type == MatchType.EXACT ? 0 : 1;
            int lenDiff = Math.abs(norm.length() - place.length());
            if (score < bestScore || (score == bestScore && lenDiff < bestLenDiff)) {
                best = new AttractionMatch(candidate, type);
                bestScore = score;
                bestLenDiff = lenDiff;
            }
        }
        return Optional.ofNullable(best);
    }

    private static MatchType classify(String place, String candidate) {
        if (candidate.length() < MIN_LENGTH) {
            return null;
        }
        if (place.equals(candidate)) {
            return MatchType.EXACT;
        }
        if (candidate.contains(place) || place.contains(candidate)) {
            return MatchType.PARTIAL;
        }
        return null;
    }

    private static String normalize(String name) {
        return name == null ? "" : name.replaceAll("\\s+", "");
    }
}
