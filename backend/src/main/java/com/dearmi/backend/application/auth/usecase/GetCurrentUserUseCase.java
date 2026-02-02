package com.dearmi.backend.application.auth.usecase;

import com.dearmi.backend.application.auth.dto.UserResult;

import java.util.UUID;

/**
 * 현재 인증된 사용자 정보 조회 UseCase
 */
public interface GetCurrentUserUseCase {

    UserResult getCurrentUser(UUID userId);
}
