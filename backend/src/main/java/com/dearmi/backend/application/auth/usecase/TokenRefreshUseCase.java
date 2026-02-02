package com.dearmi.backend.application.auth.usecase;

import com.dearmi.backend.application.auth.dto.AuthTokenResult;
import com.dearmi.backend.application.auth.dto.TokenRefreshCommand;

/**
 * Refresh Token으로 새 Access/Refresh Token 발급 (Rotation 포함)
 */
public interface TokenRefreshUseCase {

    AuthTokenResult refresh(TokenRefreshCommand command);
}
