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

    /** HTTP 응답 상태코드 */
    private final HttpStatus httpStatus;

    /**
     * ErrorCode로부터 예외 생성
     */
    public CustomException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode.getCode();
        this.httpStatus = errorCode.getHttpStatus();
    }

    /**
     * ErrorCode + 커스텀 메시지로 예외 생성
     * (기본 메시지를 덮어쓸 때 사용)
     */
    public CustomException(ErrorCode errorCode, String customMessage) {
        super(customMessage);
        this.errorCode = errorCode.getCode();
        this.httpStatus = errorCode.getHttpStatus();
    }
}
