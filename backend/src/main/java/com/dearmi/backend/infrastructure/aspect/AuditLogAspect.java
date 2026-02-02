package com.dearmi.backend.infrastructure.aspect;

import com.dearmi.backend.domain.audit.AuditLog;
import com.dearmi.backend.domain.audit.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.UUID;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class AuditLogAspect {

    private final AuditLogRepository auditLogRepository;

    @Around("@annotation(audited)")
    public Object audit(ProceedingJoinPoint joinPoint, Audited audited) throws Throwable {
        Object result = joinPoint.proceed();

        try {
            UUID userId = extractUserId();
            UUID resourceId = extractResourceId(joinPoint.getArgs());
            String ipAddress = extractIp();

            auditLogRepository.save(AuditLog.builder()
                    .userId(userId)
                    .action(audited.action())
                    .resourceType(audited.resourceType())
                    .resourceId(resourceId)
                    .ipAddress(ipAddress)
                    .build());
        } catch (Exception e) {
            // 감사 로그 실패는 본 요청에 영향 주지 않음
            log.warn("감사 로그 저장 실패: {}", e.getMessage());
        }

        return result;
    }

    private UUID extractUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof UUID id) return id;
        try {
            return UUID.fromString(principal.toString());
        } catch (Exception e) {
            return null;
        }
    }

    private UUID extractResourceId(Object[] args) {
        // 메서드 파라미터에서 첫 번째 UUID가 아닌 것(userId 제외) 탐색
        // Controller: getDetail(@AuthenticatedUserId UUID userId, @PathVariable UUID prescriptionId)
        if (args == null || args.length < 2) return null;
        for (int i = 1; i < args.length; i++) {
            if (args[i] instanceof UUID id) return id;
        }
        return null;
    }

    private String extractIp() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) return null;
            HttpServletRequest request = attrs.getRequest();
            String forwarded = request.getHeader("X-Forwarded-For");
            return (forwarded != null && !forwarded.isBlank())
                    ? forwarded.split(",")[0].strip()
                    : request.getRemoteAddr();
        } catch (Exception e) {
            return null;
        }
    }
}
