package com.dearmi.backend.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * API 공통 응답 래퍼
 * - 성공: success(data) 사용
 * - 실패: fail(code, message) 사용
 *
 * @param <T> 응답 데이터 타입
 */
@Getter
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL) // null 필드는 JSON에서 제외
public class ApiResponse<T> {

    /** 요청 성공 여부 */
    private final boolean success;

    /** 응답 데이터 (성공 시) */
    private final T data;

    /** 에러 코드 (실패 시) */
    private final String errorCode;

    /** 에러 메시지 (실패 시) */
    private final String message;

    /**
     * 성공 응답 생성 (데이터 포함)
     *
     * @param data 응답 데이터
     * @return 성공 ApiResponse
     */
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null, null);
    }

    /**
     * 성공 응답 생성 (데이터 없음, 단순 OK)
     *
     * @return 성공 ApiResponse
     */
    public static ApiResponse<Void> success() {
        return new ApiResponse<>(true, null, null, null);
    }

    /**
     * 실패 응답 생성
     *
     * @param errorCode 에러 코드 식별자
     * @param message   사용자에게 노출할 에러 메시지
     * @return 실패 ApiResponse
     */
    public static <T> ApiResponse<T> fail(String errorCode, String message) {
        return new ApiResponse<>(false, null, errorCode, message);
    }
}
