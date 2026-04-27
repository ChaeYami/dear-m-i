package com.dearmi.backend.application.auth.dto;

/**
 * Apple identityToken (OIDC ID Token) 검증 결과
 *
 * @param sub   Apple 사용자 고유 ID (provider_id 로 사용)
 * @param email Apple 계정 이메일 (private relay 일 수 있음). 최초 로그인 후 동의 해제 시 null 가능
 */
public record AppleIdentityClaims(
        String sub,
        String email
) {}
