package com.dearmi.backend.infrastructure.security;

import com.dearmi.backend.application.auth.dto.AppleIdentityClaims;
import com.dearmi.backend.application.auth.port.AppleIdentityTokenVerifier;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

/**
 * Native Apple Sign-In identityToken 검증 구현체.
 *
 * <p>검증 항목 (Apple 공식 권장):
 * <ol>
 *   <li>RS256 서명 — Apple JWKS ({@code https://appleid.apple.com/auth/keys}) 의 공개키로 검증.
 *       NimbusJwtDecoder 가 자동 fetch + 캐싱.</li>
 *   <li>iss == {@code https://appleid.apple.com}</li>
 *   <li>aud == 앱 bundleId (Native Apple Sign-In 의 audience 는 web OAuth client_id 가 아니라
 *       앱 bundleId 임에 주의)</li>
 *   <li>exp 미만료 — {@link JwtTimestampValidator}</li>
 * </ol>
 * 어느 하나라도 실패하면 401 UNAUTHORIZED.
 */
@Slf4j
@Component
public class AppleIdentityTokenVerifierImpl implements AppleIdentityTokenVerifier {

    private static final String APPLE_ISSUER = "https://appleid.apple.com";
    private static final String APPLE_JWK_SET_URI = "https://appleid.apple.com/auth/keys";

    private final NimbusJwtDecoder decoder;
    private final String expectedAudience;

    public AppleIdentityTokenVerifierImpl(
            @Value("${apple.native.audience:${APPLE_BUNDLE_ID:com.chloee0033.dearmiapp}}") String expectedAudience) {
        this.expectedAudience = expectedAudience;

        NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withJwkSetUri(APPLE_JWK_SET_URI).build();
        OAuth2TokenValidator<Jwt> validator = new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(),
                new JwtIssuerValidator(APPLE_ISSUER)
        );
        jwtDecoder.setJwtValidator(validator);
        this.decoder = jwtDecoder;
    }

    @Override
    public AppleIdentityClaims verify(String identityToken) {
        try {
            Jwt jwt = decoder.decode(identityToken);

            if (jwt.getAudience() == null || !jwt.getAudience().contains(expectedAudience)) {
                log.warn("Apple identityToken aud 불일치: expected={} actual={}",
                        expectedAudience, jwt.getAudience());
                throw new CustomException(ErrorCode.UNAUTHORIZED);
            }

            String sub = jwt.getSubject();
            if (sub == null || sub.isBlank()) {
                throw new CustomException(ErrorCode.UNAUTHORIZED);
            }

            return new AppleIdentityClaims(sub, jwt.getClaimAsString("email"));
        } catch (JwtException e) {
            log.warn("Apple identityToken JWT 검증 실패: {}", e.getMessage());
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }
    }
}
