package com.dearmi.backend.infrastructure.security;

import java.lang.annotation.*;

/**
 * 컨트롤러 파라미터 어노테이션 — JWT에서 추출한 현재 사용자 UUID를 주입
 *
 * <pre>
 * &#64;GetMapping("/me")
 * public ResponseEntity<?> me(&#64;AuthenticatedUserId UUID userId) { ... }
 * </pre>
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface AuthenticatedUserId {
}
