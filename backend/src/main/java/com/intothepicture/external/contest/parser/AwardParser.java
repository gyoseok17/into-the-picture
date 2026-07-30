package com.intothepicture.external.contest.parser;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 수상내역(koWnprzDiz) → 부문/등급 파싱(순수 함수). 실측 95건 모두 {@code "{부문} 부문 [{등급}]"} 형식.
 * 예: "스마트폰 부문 [입선]" → division="스마트폰 부문", grade="입선".
 * 대괄호/공백 변형(전각 ［］ 포함)을 방어하며, 대괄호가 없으면 전체를 division 으로 둔다(grade=null).
 */
public final class AwardParser {

    // 그룹1: 대괄호 앞(부문), 그룹2: 대괄호 안(등급). 반각[]·전각［］ 모두 허용.
    private static final Pattern AWARD = Pattern.compile("^\\s*(.*?)\\s*[\\[\\uFF3B]\\s*(.*?)\\s*[\\]\\uFF3D]\\s*$");

    private AwardParser() {
    }

    public static Award parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return new Award(null, null);
        }
        Matcher matcher = AWARD.matcher(raw);
        if (matcher.matches()) {
            String division = emptyToNull(matcher.group(1));
            String grade = emptyToNull(matcher.group(2));
            return new Award(division, grade);
        }
        return new Award(raw.strip(), null);
    }

    private static String emptyToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.strip();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
