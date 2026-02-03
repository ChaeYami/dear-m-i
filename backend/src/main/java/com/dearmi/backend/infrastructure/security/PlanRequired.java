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
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface PlanRequired {
    SubscriptionPlan value() default SubscriptionPlan.PREMIUM;
}
