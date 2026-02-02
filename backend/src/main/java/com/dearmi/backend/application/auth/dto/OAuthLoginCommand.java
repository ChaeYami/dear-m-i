package com.dearmi.backend.application.auth.dto;

/**
 * OAuth2 로그인 커맨드
 *
 * @param provider   OAuth2 프로바이더 (google, apple)
 * @param providerId 프로바이더 고유 사용자 ID (sub)
 * @param email      사용자 이메일
 * @param name       사용자 이름
 */
public record OAuthLoginCommand(
        String provider,
        String providerId,
        String email,
        String name
) {}
