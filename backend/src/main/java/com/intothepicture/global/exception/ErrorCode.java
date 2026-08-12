package com.intothepicture.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/** 공통 에러 코드·HTTP 상태(docs/04: 400/401/403/404/429/502). */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "요청이 올바르지 않습니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),
    CONFLICT(HttpStatus.CONFLICT, "현재 상태에서는 처리할 수 없습니다."),
    NOT_FOUND(HttpStatus.NOT_FOUND, "대상을 찾을 수 없습니다."),
    EXTERNAL_QUOTA(HttpStatus.TOO_MANY_REQUESTS, "외부 API 호출 한도를 초과했습니다."),
    EXTERNAL_ERROR(HttpStatus.BAD_GATEWAY, "외부 API 호출에 실패했습니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다.");

    private final HttpStatus status;
    private final String defaultMessage;
}
