package com.intothepicture.global.exception;

/**
 * 외부 API(관광공사·카카오) 호출 실패. external 어댑터가 던지면 ErrorCode 에 따라
 * 429(EXTERNAL_QUOTA)·502(EXTERNAL_ERROR)로 변환(docs/04·09).
 */
public class ExternalApiException extends BusinessException {

    public ExternalApiException(ErrorCode errorCode) {
        super(errorCode);
    }

    public ExternalApiException(ErrorCode errorCode, String message) {
        super(errorCode, message);
    }
}
