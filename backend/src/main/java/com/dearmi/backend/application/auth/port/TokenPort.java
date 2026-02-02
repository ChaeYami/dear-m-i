package com.dearmi.backend.application.auth.port;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 토큰 생성/검증 Port (Infrastructure → Application 방향 추상화)
 * - 구현체: infrastructure/security/JwtProvider
 */
public interface TokenPort {

    String generateAccessToken(UUID userId, String email);

    String generateRefreshToken(UUID userId);

    boolean validateToken(String token);

    UUID extractUserId(String token);

    String extractTokenType(String token);

    /** 토큰을 SHA-256 해싱 (DB 저장용) */
    String hashToken(String rawToken);

    /** Refresh token DB 저장 시 만료 시각 계산 */
    LocalDateTime calculateRefreshTokenExpiry();
}
