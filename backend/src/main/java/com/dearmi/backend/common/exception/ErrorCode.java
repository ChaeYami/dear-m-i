package com.dearmi.backend.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/**
 * 애플리케이션 전역 에러 코드 정의
 * - 각 에러에 HTTP 상태코드와 메시지를 함께 관리
 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // ==================== 인증/인가 ====================
    /** 인증 토큰이 없거나 유효하지 않음 */
    UNAUTHORIZED("AUTH_001", "인증이 필요합니다.", HttpStatus.UNAUTHORIZED),

    /** 토큰이 만료됨 */
    TOKEN_EXPIRED("AUTH_002", "토큰이 만료되었습니다.", HttpStatus.UNAUTHORIZED),

    /** 접근 권한이 없음 */
    FORBIDDEN("AUTH_003", "접근 권한이 없습니다.", HttpStatus.FORBIDDEN),

    // ==================== 리소스 ====================
    /** 요청한 리소스를 찾을 수 없음 (타인 리소스 접근 시에도 404 반환) */
    NOT_FOUND("RESOURCE_001", "요청한 리소스를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),

    /** 이미 존재하는 리소스 */
    ALREADY_EXISTS("RESOURCE_002", "이미 존재하는 리소스입니다.", HttpStatus.CONFLICT),

    // ==================== 플랜/구독 ====================
    /** 해당 기능은 유료 플랜이 필요함 */
    PLAN_REQUIRED("PLAN_001", "해당 기능을 사용하려면 플랜 업그레이드가 필요합니다.", HttpStatus.PAYMENT_REQUIRED),

    /** 플랜별 콘텐츠 생성 한도 초과 */
    CONTENT_LIMIT_EXCEEDED("PLAN_002", "콘텐츠 생성 한도를 초과했습니다.", HttpStatus.TOO_MANY_REQUESTS),

    // ==================== 요청 ====================
    /** 요청 파라미터 또는 바디가 유효하지 않음 */
    INVALID_REQUEST("REQ_001", "요청 값이 올바르지 않습니다.", HttpStatus.BAD_REQUEST),

    /** Rate Limit 초과 */
    RATE_LIMIT_EXCEEDED("REQ_002", "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", HttpStatus.TOO_MANY_REQUESTS),

    // ==================== 서버 ====================
    /** 서버 내부 오류 */
    INTERNAL_SERVER_ERROR("SERVER_001", "서버 내부 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR),

    /** 외부 서비스 연동 오류 */
    EXTERNAL_SERVICE_ERROR("SERVER_002", "외부 서비스 연동 중 오류가 발생했습니다.", HttpStatus.BAD_GATEWAY);

    /** 에러 코드 식별자 */
    private final String code;

    /** 사용자에게 노출할 메시지 */
    private final String message;

    /** HTTP 응답 상태코드 */
    private final HttpStatus httpStatus;
}
