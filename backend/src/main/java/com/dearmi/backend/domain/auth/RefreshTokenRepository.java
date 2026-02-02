package com.dearmi.backend.domain.auth;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository {

    RefreshToken save(RefreshToken refreshToken);

    Optional<RefreshToken> findByUserId(UUID userId);

    /** 탈퇴 시 즉시 삭제 (⑥ 원칙) */
    void deleteByUserId(UUID userId);
}
