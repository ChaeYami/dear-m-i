package com.dearmi.backend.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * 애플리케이션 커스텀 예외
 * - ErrorCode를 통해 에러 유형과 HTTP 상태를 일관되게 관리
 * - 사용 예: throw new CustomException(ErrorCode.NOT_FOUND);
 */
@Getter
public class CustomException extends RuntimeException {

    /** 에러 코드 식별자 (예: "RESOURCE_001") */
    private final String errorCode;

    /** MessageSource 메시지 키 */
    private final String messageKey;

    /** MessageSource 메시지 인자 (예: 글자수 제한 값) */
    private final Object[] messageArgs;

    /** HTTP 응답 상태코드 */
    private final HttpStatus httpStatus;

    /**
     * ErrorCode로부터 예외 생성
     */
    public CustomException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode.getCode();
        this.messageKey = errorCode.getMessageKey();
        this.messageArgs = null;
        this.httpStatus = errorCode.getHttpStatus();
    }

    /**
     * ErrorCode + 커스텀 메시지로 예외 생성
     * (기본 메시지를 덮어쓸 때 사용)
     */
    public CustomException(ErrorCode errorCode, String customMessage) {
        super(customMessage);
        this.errorCode = errorCode.getCode();
        this.messageKey = errorCode.getMessageKey();
        this.messageArgs = null;
        this.httpStatus = errorCode.getHttpStatus();
    }

    /**
     * ErrorCode + MessageSource 인자로 예외 생성
     * (다국어 메시지에 동적 값을 포함할 때 사용)
     */
    public CustomException(ErrorCode errorCode, Object... messageArgs) {
        super(errorCode.getMessage());
        this.errorCode = errorCode.getCode();
        this.messageKey = errorCode.getMessageKey();
        this.messageArgs = messageArgs;
        this.httpStatus = errorCode.getHttpStatus();
    }
}
