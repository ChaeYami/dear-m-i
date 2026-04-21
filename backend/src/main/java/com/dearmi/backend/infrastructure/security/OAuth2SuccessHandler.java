package com.dearmi.backend.infrastructure.security;

import com.dearmi.backend.application.auth.dto.AuthTokenResult;
import com.dearmi.backend.application.auth.dto.OAuthLoginCommand;
import com.dearmi.backend.application.auth.usecase.LoginUseCase;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.util.Map;

/**
 * OAuth2 인증 성공 핸들러
 * - 신규/기존 유저 처리 → LoginUseCase 위임
 * - JWT 발급 후 앱 딥링크로 리다이렉트: dearmi://auth?access_token=...&refresh_token=...
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private static final String REDIRECT_SCHEME = "dearmi://auth";

    private final LoginUseCase loginUseCase;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2AuthenticationToken oAuth2Token = (OAuth2AuthenticationToken) authentication;
        String registrationId = oAuth2Token.getAuthorizedClientRegistrationId();
        OAuth2User principal = oAuth2Token.getPrincipal();

        Map<String, Object> attributes = principal.getAttributes();

        // Apple(OIDC) / Google(OAuth2) 모두 OAuth2User.getAttributes()로 접근 가능
        // OidcUser는 OidcToken claims를 attributes에 병합함
        OAuth2UserInfo userInfo = OAuth2UserInfo.of(registrationId, attributes);

        // Google CustomOAuth2UserService가 추가한 표준화 속성이 있으면 우선 사용
        String email = attributes.containsKey("_email")
                ? (String) attributes.get("_email")
                : userInfo.getEmail();
        String name = attributes.containsKey("_name")
                ? (String) attributes.get("_name")
                : userInfo.getName();

        OAuthLoginCommand command = new OAuthLoginCommand(
                userInfo.getProvider(),
                userInfo.getProviderId(),
                email,
                name
        );

        AuthTokenResult tokens = loginUseCase.login(command);

        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(REDIRECT_SCHEME)
                .queryParam("access_token", tokens.accessToken())
                .queryParam("refresh_token", tokens.refreshToken());

        // 앱이 OAuth 시작 시 보낸 app_state 를 그대로 echo — 딥링크 강제 주입(Login CSRF) 차단.
        // 앱은 콜백 수신 후 SecureStore 의 저장값과 비교해 일치할 때만 토큰 저장한다.
        HttpSession session = request.getSession(false);
        if (session != null) {
            Object appState = session.getAttribute(OAuthAppStateFilter.SESSION_KEY);
            if (appState instanceof String s && StringUtils.hasText(s)) {
                builder.queryParam("state", s);
            }
            session.removeAttribute(OAuthAppStateFilter.SESSION_KEY);
        }

        log.debug("OAuth2 로그인 성공, 딥링크 리다이렉트: provider={}", registrationId);
        response.sendRedirect(builder.build().toUriString());
    }
}
