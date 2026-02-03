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

    @Around("@annotation(planRequired)")
    public Object checkPlan(ProceedingJoinPoint joinPoint, PlanRequired planRequired) throws Throwable {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UUID userId)) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        boolean isPremium = subscriptionRepository.findByUserId(userId)
                .map(s -> s.isPremium())
                .orElse(false);

        if (!isPremium) {
            throw new CustomException(ErrorCode.PLAN_REQUIRED);
        }

        return joinPoint.proceed();
    }
}
