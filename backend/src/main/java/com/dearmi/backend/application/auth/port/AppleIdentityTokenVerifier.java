package com.dearmi.backend.application.auth.port;

import com.dearmi.backend.application.auth.dto.AppleIdentityClaims;

/**
 * Native Apple Sign-In 의 identityToken (Apple OIDC ID Token) 검증 Port.
 * <p>
 * 구현체는 Apple JWKS 로 RSA 서명 검증 + iss/aud/exp 표준 클레임 검증을 수행한다.
 * 검증 실패 시 {@link com.dearmi.backend.common.exception.CustomException} (UNAUTHORIZED) 를 던진다.
 */
public interface AppleIdentityTokenVerifier {

    AppleIdentityClaims verify(String identityToken);
}
