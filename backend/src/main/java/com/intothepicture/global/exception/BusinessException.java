package com.intothepicture.global.exception;

import lombok.Getter;

/** 도메인 비즈니스 예외. GlobalExceptionHandler 가 ErrorCode 에 맞는 상태/포맷으로 변환. */
@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getDefaultMessage());
        this.errorCode = errorCode;
    }

    public BusinessException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}
