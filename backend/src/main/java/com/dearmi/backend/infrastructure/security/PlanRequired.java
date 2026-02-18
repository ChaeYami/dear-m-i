package com.dearmi.backend.infrastructure.security;

import com.dearmi.backend.domain.subscription.SubscriptionPlan;

import java.lang.annotation.*;

/**
 * 해당 메서드를 호출하려면 지정된 플랜 이상의 구독이 필요함을 표시하는 어노테이션.
 * PlanLimitAspect가 FREE 플랜 유저에게 402(PAYMENT_REQUIRED)를 반환한다.
 *
 * <pre>
 * &#64;PlanRequired(SubscriptionPlan.PREMIUM)
 * public void premiumOnlyMethod() { ... }
 * </pre>
 *
 * <p><b>주의: AOP self-invocation</b> — 같은 클래스 내부의 다른 메서드에서 호출하면
 * Spring 프록시가 우회되어 검증이 무음으로 누락된다. 반드시 외부(컨트롤러, 다른 빈)에서
 * 진입해야 한다. 또한 {@code @Async} 메서드에 직접 붙이면 별도 스레드에 SecurityContext 가
 * 전파되지 않아 항상 401 이 발생한다 — 호출자(UseCase) 메서드에 부착할 것.
 *
 * <p><b>또 다른 함정</b> — 내부적으로 SecurityContextHolder 의 principal 을 읽으므로,
 * 인증되지 않은 엔드포인트 (PUBLIC_ENDPOINTS) 에서 호출되는 UseCase 에 붙이면 401 발생.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface PlanRequired {
    SubscriptionPlan value() default SubscriptionPlan.PREMIUM;
}
