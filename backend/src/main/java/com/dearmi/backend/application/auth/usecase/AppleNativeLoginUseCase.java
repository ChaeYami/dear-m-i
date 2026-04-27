package com.dearmi.backend.application.auth.usecase;

import com.dearmi.backend.application.auth.dto.AppleNativeLoginCommand;
import com.dearmi.backend.application.auth.dto.AuthTokenResult;

/**
 * Native Apple Sign-In (expo-apple-authentication) 로그인 UseCase.
 * <p>
 * 흐름: identityToken 검증 → 유저 조회/생성 → JWT 발급.
 * 기존 redirect-based OAuth2 흐름 ({@link LoginUseCase}) 과는 entry point 만 다르고
 * 유저 처리 / 토큰 발급 로직은 동일하게 위임한다.
 */
public interface AppleNativeLoginUseCase {

    AuthTokenResult login(AppleNativeLoginCommand command);
}
