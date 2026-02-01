package com.dearmi.backend.common.exception;

import com.dearmi.backend.common.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

/**
 * 전역 예외 처리 핸들러
 * - CustomException: 비즈니스 로직 예외를 ErrorCode 기반으로 처리
 * - MethodArgumentNotValidException: @Valid 검증 실패 처리
 * - Exception: 예상치 못한 예외 처리 (500 반환)
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 비즈니스 규칙 위반 예외 처리
     * CustomException은 ErrorCode에 정의된 HTTP 상태코드로 응답
     */
    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ApiResponse<Void>> handleCustomException(CustomException e) {
        log.warn("CustomException 발생: errorCode={}, message={}", e.getErrorCode(), e.getMessage());
        return ResponseEntity
                .status(e.getHttpStatus())
                .body(ApiResponse.fail(e.getErrorCode(), e.getMessage()));
    }

    /**
     * @Valid, @Validated 검증 실패 예외 처리
     * 검증 실패한 필드명과 메시지를 조합하여 응답
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException e) {
        // 모든 필드 에러를 "필드명: 메시지" 형태로 조합
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));

        log.warn("유효성 검증 실패: {}", message);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.fail(ErrorCode.INVALID_REQUEST.getCode(), message));
    }

    /**
     * 예상치 못한 예외 처리 (500 Internal Server Error)
     * 민감한 내부 정보가 외부로 노출되지 않도록 일반 메시지만 반환
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpectedException(Exception e) {
        log.error("예상치 못한 예외 발생", e);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.fail(
                        ErrorCode.INTERNAL_SERVER_ERROR.getCode(),
                        ErrorCode.INTERNAL_SERVER_ERROR.getMessage()
                ));
    }
}
