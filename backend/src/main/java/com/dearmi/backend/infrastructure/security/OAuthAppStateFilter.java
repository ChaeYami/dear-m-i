package com.dearmi.backend.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * 앱에서 시작한 OAuth flow 의 endpoint binding 검증용 nonce 처리.
 *
 * <p>Spring 의 표준 OAuth2 state 는 백엔드 ↔ IdP 간 CSRF 방어용. 별도로 앱은 OAuth 시작 시
 * 임의 nonce 를 `app_state` query 로 전달하고, 콜백 redirect URI 에서 동일 값을 echo 받아
 * 비교한다. 이를 통해 외부에서 임의로 `dearmi://auth?access_token=...` 딥링크를 강제 주입해
 * 피해자를 공격자 계정으로 로그인시키는 Login CSRF 를 차단한다.
 *
 * <p>이 필터는 `/oauth2/authorization/**` 진입 시 `app_state` 쿼리를 servlet session 에 저장하고,
 * {@link OAuth2SuccessHandler} 가 redirect 시 꺼내 echo 한다. WebBrowser.openAuthSessionAsync 가
 * OAuth flow 동안 in-app browser 의 session cookie 를 유지하므로 같은 session 이 보장된다.
 *
 * <p><b>실행 순서 주의</b>: Spring Security 의 {@code OAuth2AuthorizationRequestRedirectFilter} 는
 * `/oauth2/authorization/**` 매칭 시 Google 로 즉시 302 리다이렉트하며 필터 체인을 중단(chain.doFilter 미호출)한다.
 * 따라서 이 필터가 Security 필터 체인보다 <b>먼저</b> 실행돼 app_state 를 세션에 저장해야 한다.
 * {@code @Order(HIGHEST_PRECEDENCE)} 가 없으면 자동 등록 시 LOWEST_PRECEDENCE 로 Security 뒤에 놓여
 * 실행되지 못하고, 콜백에서 state 가 누락돼 앱이 로그인 실패(state 불일치)로 처리한다.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class OAuthAppStateFilter extends OncePerRequestFilter {

    public static final String SESSION_KEY = "DEARMI_OAUTH_APP_STATE";

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        if (req.getRequestURI().startsWith("/oauth2/authorization/")) {
            String appState = req.getParameter("app_state");
            if (StringUtils.hasText(appState)) {
                req.getSession(true).setAttribute(SESSION_KEY, appState);
            }
        }
        chain.doFilter(req, res);
    }
}
