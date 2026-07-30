package com.intothepicture.external.contest.parser;

/** 수상내역 파싱 결과(부문/등급). 파싱 실패 시 각 필드는 null 일 수 있다. */
public record Award(String division, String grade) {
}
