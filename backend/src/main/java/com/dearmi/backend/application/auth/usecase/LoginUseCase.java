package com.dearmi.backend.application.auth.usecase;

import com.dearmi.backend.application.auth.dto.AuthTokenResult;
import com.dearmi.backend.application.auth.dto.OAuthLoginCommand;

/**
 * OAuth2 소셜 로그인 UseCase
 * - 신규 유저: users 테이블 저장 + 기본 Subscription/NotificationSetting 생성
 * - 기존 유저: 조회
 * - 두 경우 모두: JWT Access/Refresh Token 발급
 */
public interface LoginUseCase {

    AuthTokenResult login(OAuthLoginCommand command);
}
