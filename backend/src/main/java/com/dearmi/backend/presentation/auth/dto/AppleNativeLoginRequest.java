package com.dearmi.backend.presentation.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Native Apple Sign-In (expo-apple-authentication) 요청 DTO
 *
 * @param identityToken Apple 이 발급한 ID Token. 필수
 * @param fullName      "이름 성" 형식. 최초 로그인 시에만 Apple 이 한 번 제공. nullable
 * @param email         최초 로그인 시 Apple 이 제공하는 이메일 (private relay 가능). nullable
 */
public record AppleNativeLoginRequest(
        @NotBlank String identityToken,
        String fullName,
        String email
) {}
