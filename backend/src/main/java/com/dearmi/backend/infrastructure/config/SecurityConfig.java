package com.dearmi.backend.infrastructure.config;

import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.common.response.ApiResponse;
import com.dearmi.backend.infrastructure.security.AppleAwareOAuth2AuthorizationRequestResolver;
import com.dearmi.backend.infrastructure.security.CustomOAuth2UserService;
import com.dearmi.backend.infrastructure.security.JwtAuthenticationFilter;
import com.dearmi.backend.infrastructure.security.JwtProvider;
import com.dearmi.backend.infrastructure.security.OAuth2SuccessHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

import java.nio.charset.StandardCharsets;

/**
 * Spring Security 설정
 * - JWT 기반 Stateless 인증 (API 호출)
 * - OAuth2 Login (Google, Apple) → 성공 시 JWT 발급 후 앱 딥링크 리다이렉트
 * - Session: IF_REQUIRED — OAuth2 state 파라미터 검증에만 세션 사용, 이후 JWT로 전환
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final ObjectMapper objectMapper;
    private final JwtProvider jwtProvider;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final CorsConfigurationSource corsConfigurationSource;
    private final AppleAwareOAuth2AuthorizationRequestResolver appleAwareResolver;

    /**
     * 인증 없이 접근 가능한 공개 엔드포인트
     * OAuth2 관련 경로(/oauth2/**, /login/oauth2/**)는 oauth2Login() 설정에서 자동 허용
     */
    private static final String[] PUBLIC_ENDPOINTS = {
            "/api/v1/auth/refresh",     // Refresh Token으로 새 토큰 발급
            "/api/v1/app/version",      // 앱 버전 확인
            "/api/v1/webhooks/apple",  // Apple Server-to-Server 알림 (외부 호출)
            "/api/v1/dev/**",           // 로컬 개발 전용 (DevAuthController)
            "/actuator/health",         // 헬스체크
            "/v3/api-docs/**",          // OpenAPI JSON
            "/swagger-ui/**",           // Swagger UI
            "/swagger-ui.html",         // Swagger UI entry
            // 정적 약관/정책 페이지 (스토어 심사 + 외부 공유용)
            "/privacy-ko.html", "/privacy-en.html",
            "/terms-ko.html", "/terms-en.html",
            "/licenses-ko.html", "/licenses-en.html",
            "/css/**",
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)

                // OAuth2 authorization request state 검증용으로만 세션 사용
                // (브라우저 기반 OAuth2 플로우 → JWT 발급 → 앱 딥링크로 이후 세션 불필요)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                )

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                        .anyRequest().authenticated()
                )

                // OAuth2 소셜 로그인 설정
                .oauth2Login(oauth2 -> oauth2
                        // Apple 은 name/email scope 요청 시 response_mode=form_post 요구
                        .authorizationEndpoint(endpoint -> endpoint
                                .authorizationRequestResolver(appleAwareResolver)
                        )
                        .userInfoEndpoint(info -> info
                                .userService(customOAuth2UserService)   // Google (표준 OAuth2)
                                // Apple은 OIDC → Spring 기본 OidcUserService가 처리
                        )
                        .successHandler(oAuth2SuccessHandler)
                )

                // 인증/인가 예외 핸들러
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(unauthorizedEntryPoint())
                        .accessDeniedHandler(accessDeniedHandler())
                )

                // JWT 필터: UsernamePasswordAuthenticationFilter 앞에 위치
                .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(jwtProvider);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationEntryPoint unauthorizedEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write(objectMapper.writeValueAsString(
                    ApiResponse.fail(ErrorCode.UNAUTHORIZED.getCode(), ErrorCode.UNAUTHORIZED.getMessage())
            ));
        };
    }

    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write(objectMapper.writeValueAsString(
                    ApiResponse.fail(ErrorCode.FORBIDDEN.getCode(), ErrorCode.FORBIDDEN.getMessage())
            ));
        };
    }
}
