package com.dearmi.backend.application.auth.dto;

/**
 * JWT 토큰 쌍 결과 DTO
 *
 * @param accessToken  Access Token (1시간)
 * @param refreshToken Refresh Token (30일, raw - 클라이언트에게 전달)
 */
public record AuthTokenResult(String accessToken, String refreshToken) {}
