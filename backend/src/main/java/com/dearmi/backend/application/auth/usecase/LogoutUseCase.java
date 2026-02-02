package com.dearmi.backend.application.auth.usecase;

import java.util.UUID;

/**
 * 로그아웃 UseCase
 * - refresh_tokens 테이블에서 해당 userId 토큰 즉시 삭제
 */
public interface LogoutUseCase {

    void logout(UUID userId);
}
