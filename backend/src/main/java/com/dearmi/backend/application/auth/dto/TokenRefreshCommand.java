package com.dearmi.backend.application.auth.dto;

/**
 * Refresh Token 갱신 커맨드
 *
 * @param refreshToken 클라이언트가 보유한 Refresh Token (raw)
 */
public record TokenRefreshCommand(String refreshToken) {}
