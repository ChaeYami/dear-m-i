package com.dearmi.backend.application.auth.dto;

/**
 * Native Apple Sign-In 로그인 커맨드 (expo-apple-authentication 흐름)
 *
 * @param identityToken Apple 이 발급한 ID Token (JWT). 백엔드가 JWKS 로 서명/클레임 검증
 * @param fullName      최초 로그인 시 Apple 이 한 번만 제공하는 사용자 이름 ("이름 성"). 이후 null
 * @param email         최초 로그인 시 Apple 이 한 번만 제공하는 이메일. 이후 identityToken 의 email claim 으로 fallback
 */
public record AppleNativeLoginCommand(
        String identityToken,
        String fullName,
        String email
) {}
