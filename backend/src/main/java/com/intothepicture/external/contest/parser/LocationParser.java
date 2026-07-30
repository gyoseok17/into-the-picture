package com.intothepicture.external.contest.parser;

/**
 * 촬영지(koFilmst) → 시도/시군구/장소명 파싱(순수 함수).
 * 실측 형식: {@code "{시도} {시군구}[ {읍면동}], {장소명}"} (콤마/슬래시로 행정구역과 장소명 구분).
 *
 * <p>예: "경상남도 합천군, 가야산국립공원" → sido="경상남도", sigungu="합천군", placeName="가야산국립공원".
 * "울산광역시 동구 일산동, 대왕암공원" → sido="울산광역시", sigungu="동구", placeName="대왕암공원".
 * "경상북도 포항시 남구, 모포항 물통바위" → sigungu="포항시 남구"(시군구 코드표가 시+일반구 단위).
 * 시도는 첫 조각의 첫 토큰, 장소명은 마지막 조각. 시군구는 "{시} {구}"(일반구) 또는 첫 시/군/구 접미 토큰.
 */
public final class LocationParser {

    private LocationParser() {
    }

    public static ParsedLocation parse(String location) {
        if (location == null || location.isBlank()) {
            return new ParsedLocation(null, null, null);
        }
        String[] segments = location.split("[,/]");
        String firstSegment = segments[0].strip();
        String placeName = segments[segments.length - 1].strip();

        String[] tokens = firstSegment.split("\\s+");
        String sido = tokens.length > 0 ? emptyToNull(tokens[0]) : null;
        String sigungu = findSigungu(tokens);

        return new ParsedLocation(sido, sigungu, emptyToNull(placeName));
    }

    /**
     * 시군구 추출(시도 토큰 index 0 제외). "{시} {구}"(예: 포항시 남구 — 도 산하 일반구)는 코드표가
     * 시+구 단위라 합쳐서 반환하고, 그 외에는 시/군/구 로 끝나는 첫 토큰(합천군·동구·삼척시)을 반환한다.
     */
    private static String findSigungu(String[] tokens) {
        if (tokens.length >= 3 && tokens[1].endsWith("시") && tokens[2].endsWith("구")) {
            return tokens[1] + " " + tokens[2];
        }
        for (int i = 1; i < tokens.length; i++) {
            String token = tokens[i];
            if (token.endsWith("시") || token.endsWith("군") || token.endsWith("구")) {
                return token;
            }
        }
        return null;
    }

    private static String emptyToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.strip();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
