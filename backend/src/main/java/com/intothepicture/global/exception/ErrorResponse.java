package com.intothepicture.global.exception;

/** 공통 에러 응답 포맷: { "error": { "code", "message" } } (docs/04). */
public record ErrorResponse(ErrorBody error) {

    public record ErrorBody(String code, String message) {
    }

    public static ErrorResponse of(ErrorCode code, String message) {
        return new ErrorResponse(new ErrorBody(code.name(), message));
    }
}
