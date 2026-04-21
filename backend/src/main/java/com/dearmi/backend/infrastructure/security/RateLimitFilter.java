package com.dearmi.backend.infrastructure.security;

import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.common.response.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

/**
 * IP 기반 토큰 버킷 rate limiting (Bucket4j 인메모리).
 *
 * <p>대상: 인증 / OCR / 업로드 URL 발급 등 abusive 시 비용 폭증 가능 엔드포인트.
 *
 * <p>단일 인스턴스 한정. ECS multi-instance 환경에서는 인스턴스별로 제한이 분배되지만,
 * abusive 클라이언트는 ALB sticky 또는 동일 IP 로 인해 한 인스턴스에 집중되므로 실효성 있음.
 * 엄격한 글로벌 제한이 필요해지면 Redis backend (bucket4j-redis) 로 교체.
 */
@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper;

    /** pathPrefix 끝이 '/' 면 prefix 매치, 아니면 정확 매치. */
    private record Rule(String method, String pathPrefix, Supplier<Bandwidth> bandwidth) {}

    private static final List<Rule> RULES = List.of(
            // OAuth2 로그인 시작 — IP 당 분당 10회
            new Rule("GET", "/oauth2/authorization/",
                    () -> Bandwidth.simple(10, Duration.ofMinutes(1))),
            // 토큰 갱신 — IP 당 분당 20회 (앱이 401 → refresh 정상 재시도 흡수)
            new Rule("POST", "/api/v1/auth/refresh",
                    () -> Bandwidth.simple(20, Duration.ofMinutes(1))),
            // 처방전 업로드 URL 발급 — IP 당 분당 20회
            new Rule("POST", "/api/v1/prescriptions/upload-url",
                    () -> Bandwidth.simple(20, Duration.ofMinutes(1))),
            // 처방전 등록 (Claude Vision OCR 트리거, 비용 큼) — IP 당 분당 5회
            new Rule("POST", "/api/v1/prescriptions",
                    () -> Bandwidth.simple(5, Duration.ofMinutes(1)))
    );

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        Rule matched = findRule(req);
        if (matched == null) {
            chain.doFilter(req, res);
            return;
        }

        String key = matched.method() + ":" + matched.pathPrefix() + ":" + clientIp(req);
        Bucket bucket = buckets.computeIfAbsent(key, k ->
                Bucket.builder().addLimit(matched.bandwidth().get()).build()
        );

        if (bucket.tryConsume(1)) {
            chain.doFilter(req, res);
            return;
        }

        res.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        res.setCharacterEncoding(StandardCharsets.UTF_8.name());
        res.getWriter().write(objectMapper.writeValueAsString(
                ApiResponse.fail(
                        ErrorCode.RATE_LIMIT_EXCEEDED.getCode(),
                        ErrorCode.RATE_LIMIT_EXCEEDED.getMessage()
                )
        ));
    }

    private Rule findRule(HttpServletRequest req) {
        String method = req.getMethod();
        String path = req.getRequestURI();
        for (Rule rule : RULES) {
            if (!rule.method().equals(method)) continue;
            if (rule.pathPrefix().endsWith("/")) {
                if (path.startsWith(rule.pathPrefix())) return rule;
            } else {
                if (path.equals(rule.pathPrefix())) return rule;
            }
        }
        return null;
    }

    private String clientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xff)) {
            // X-Forwarded-For: client, proxy1, proxy2 → 첫 값 (ALB/CloudFront 표준)
            return xff.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }
}
