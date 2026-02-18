package com.dearmi.backend.infrastructure.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * CORS 설정.
 *
 * <p>네이티브 모바일 앱은 CORS 영향을 받지 않지만, Swagger UI / 토스페이먼츠 결제 웹뷰 /
 * 향후 관리자 웹 등이 다른 origin 에서 API 를 호출한다. origin allowlist 는
 * application-{profile}.yml 의 {@code cors.allowed-origins} 로 관리한다.
 *
 * <p>credentials 는 켜지 않는다 — JWT 는 Authorization 헤더로 전달하므로 쿠키 불필요.
 */
@Configuration
public class CorsConfig {

    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource(
            @Value("${cors.allowed-origins:}") List<String> allowedOrigins,
            @Value("${cors.allowed-origin-patterns:}") List<String> allowedOriginPatterns
    ) {
        CorsConfiguration cfg = new CorsConfiguration();
        if (!allowedOrigins.isEmpty()) cfg.setAllowedOrigins(allowedOrigins);
        if (!allowedOriginPatterns.isEmpty()) cfg.setAllowedOriginPatterns(allowedOriginPatterns);
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With"));
        cfg.setExposedHeaders(List.of("Authorization"));
        cfg.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", cfg);
        source.registerCorsConfiguration("/oauth2/**", cfg);
        source.registerCorsConfiguration("/login/**", cfg);
        return source;
    }
}
