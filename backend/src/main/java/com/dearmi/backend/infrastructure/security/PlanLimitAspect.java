package com.dearmi.backend.infrastructure.security;

import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.subscription.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * @PlanRequired 어노테이션이 붙은 메서드 호출 전 구독 플랜을 검증하는 AOP Aspect.
 * SecurityContext에서 userId를 추출하여 subscriptions 테이블을 조회한다.
 * FREE 플랜이면 402(PAYMENT_REQUIRED) 예외를 발생시킨다.
 */
@Aspect
@Component
@RequiredArgsConstructor
public class PlanLimitAspect {

    private final SubscriptionRepository subscriptionRepository;
    private final Clock clock;

    @Around("@annotation(planRequired)")
    public Object checkPlan(ProceedingJoinPoint joinPoint, PlanRequired planRequired) throws Throwable {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UUID userId)) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        // plan 필드뿐 아니라 expiresAt 까지 확인 — 만료됐으나 배치/웹훅이 아직 FREE 로
        // 못 내린 PREMIUM 이 게이트를 통과하던 결함 방지.
        boolean activePremium = subscriptionRepository.findByUserId(userId)
                .map(s -> s.isActivePremium(LocalDateTime.now(clock)))
                .orElse(false);

        if (!activePremium) {
            throw new CustomException(ErrorCode.PLAN_REQUIRED);
        }

        return joinPoint.proceed();
    }
}
