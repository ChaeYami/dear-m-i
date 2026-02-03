package com.dearmi.backend.common.exception;

import com.dearmi.backend.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Locale;
import java.util.stream.Collectors;

/**
 * 전역 예외 처리 핸들러
 * - CustomException: 비즈니스 로직 예외를 ErrorCode 기반으로 처리
 * - MethodArgumentNotValidException: @Valid 검증 실패 처리
 * - Exception: 예상치 못한 예외 처리 (500 반환)
 *
 * Accept-Language 헤더 기반 다국어 에러 메시지 지원 (ko/en)
 */
@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final MessageSource messageSource;

    /**
     * 비즈니스 규칙 위반 예외 처리
     * CustomException은 ErrorCode에 정의된 HTTP 상태코드로 응답
     * MessageSource에서 다국어 메시지를 조회하고, 없으면 기본 메시지 폴백
     */
    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ApiResponse<Void>> handleCustomException(CustomException e) {
        Locale locale = LocaleContextHolder.getLocale();
        String message = resolveMessage(e.getMessageKey(), e.getMessageArgs(), e.getMessage(), locale);
        log.warn("CustomException 발생: errorCode={}, message={}", e.getErrorCode(), message);
        return ResponseEntity
                .status(e.getHttpStatus())
                .body(ApiResponse.fail(e.getErrorCode(), message));
    }

    /**
     * @Valid, @Validated 검증 실패 예외 처리
     * 검증 실패한 필드명과 메시지를 조합하여 응답
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));

        log.warn("유효성 검증 실패: {}", message);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.fail(ErrorCode.INVALID_REQUEST.getCode(), message));
    }

    /**
     * 처방전 OCR 실패 예외 처리
     */
    @ExceptionHandler(PrescriptionOcrException.class)
    public ResponseEntity<ApiResponse<Void>> handleOcrException(PrescriptionOcrException e) {
        log.error("처방전 OCR 실패: {}", e.getMessage());
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.fail(ErrorCode.EXTERNAL_SERVICE_ERROR.getCode(), e.getMessage()));
    }

    /**
     * 예상치 못한 예외 처리 (500 Internal Server Error)
     * 민감한 내부 정보가 외부로 노출되지 않도록 일반 메시지만 반환
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpectedException(Exception e) {
        Locale locale = LocaleContextHolder.getLocale();
        String message = resolveMessage(
                ErrorCode.INTERNAL_SERVER_ERROR.getMessageKey(), null,
                ErrorCode.INTERNAL_SERVER_ERROR.getMessage(), locale);
        log.error("예상치 못한 예외 발생", e);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.fail(ErrorCode.INTERNAL_SERVER_ERROR.getCode(), message));
    }

    private String resolveMessage(String messageKey, Object[] args, String fallback, Locale locale) {
        if (messageKey == null) return fallback;
        try {
            return messageSource.getMessage(messageKey, args, fallback, locale);
        } catch (Exception e) {
            return fallback;
        }
    }
}
