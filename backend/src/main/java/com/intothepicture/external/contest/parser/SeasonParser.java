package com.intothepicture.external.contest.parser;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 키워드(koKeyWord) → 계절 파싱(순수 함수). 콤마 분리 토큰을 앞에서부터 훑어 첫 계절 신호를 채택한다.
 * 실측상 제목이 3번째 키워드 토큰으로 들어가 계절어(가을/여름…)나 대표 소재(단풍/청보리…)를 포함하므로
 * 토큰 순서대로 보면 제목 우선이 되어 정확하다. 없으면 null(계절 미상은 정상).
 *
 * <p>토큰 1개 판정 규칙: ① 소재 동의어 포함 검사(벚꽃→봄, 단풍→가을, 설경→겨울 등) → ② 계절어 포함 검사
 * (봄/여름/가을/겨울). 동의어는 계절어를 포함하지 않는 대표 소재만 보수적으로 등재(추측 최소화).
 */
public final class SeasonParser {

    private static final String SPRING = "봄";
    private static final String SUMMER = "여름";
    private static final String AUTUMN = "가을";
    private static final String WINTER = "겨울";

    /** 계절어를 포함하지 않는 대표 소재 → 계절. 순서대로 contains 검사(먼저 매칭된 것 채택). */
    private static final Map<String, String> SYNONYMS = synonyms();

    private SeasonParser() {
    }

    public static String parse(String keywordsRaw) {
        if (keywordsRaw == null || keywordsRaw.isBlank()) {
            return null;
        }
        for (String token : keywordsRaw.split(",")) {
            String season = resolve(token.strip());
            if (season != null) {
                return season;
            }
        }
        return null;
    }

    private static String resolve(String token) {
        if (token.isEmpty()) {
            return null;
        }
        for (Map.Entry<String, String> entry : SYNONYMS.entrySet()) {
            if (token.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        for (String season : new String[] {SPRING, SUMMER, AUTUMN, WINTER}) {
            if (token.contains(season)) {
                return season;
            }
        }
        return null;
    }

    private static Map<String, String> synonyms() {
        Map<String, String> map = new LinkedHashMap<>();
        // 봄
        map.put("벚꽃", SPRING);
        map.put("진달래", SPRING);
        map.put("철쭉", SPRING);
        map.put("매화", SPRING);
        map.put("유채", SPRING);
        map.put("청보리", SPRING);
        map.put("보리밭", SPRING);
        map.put("신록", SPRING);
        // 여름
        map.put("해바라기", SUMMER);
        map.put("연꽃", SUMMER);
        map.put("장마", SUMMER);
        // 가을
        map.put("단풍", AUTUMN);
        map.put("억새", AUTUMN);
        map.put("갈대", AUTUMN);
        map.put("낙엽", AUTUMN);
        // 겨울
        map.put("설경", WINTER);
        map.put("눈꽃", WINTER);
        map.put("상고대", WINTER);
        map.put("설야", WINTER);
        return map;
    }
}
