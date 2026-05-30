package com.dearmi.backend.subscription;

import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.domain.subscription.PaymentProvider;
import com.dearmi.backend.domain.subscription.Subscription;
import com.dearmi.backend.domain.subscription.SubscriptionRepository;
import com.dearmi.backend.infrastructure.security.PlanLimitAspect;
import org.aspectj.lang.ProceedingJoinPoint;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlanLimitAspectTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");
    // 고정 기준 시각: 2026-06-16 12:00 KST
    private final Clock fixedClock = Clock.fixed(
            LocalDateTime.of(2026, 6, 16, 12, 0).atZone(ZONE).toInstant(), ZONE);
    private final LocalDateTime now = LocalDateTime.now(fixedClock);

    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private ProceedingJoinPoint joinPoint;

    private PlanLimitAspect planLimitAspect;

    @BeforeEach
    void setUp() {
        planLimitAspect = new PlanLimitAspect(subscriptionRepository, fixedClock);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private void authenticate(UUID userId) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userId, null));
    }

    private Subscription premiumExpiringAt(UUID userId, LocalDateTime expiresAt) {
        Subscription subscription = Subscription.builder().userId(userId).build();
        subscription.activatePremium(PaymentProvider.APP_STORE, "txn-001", expiresAt);
        return subscription;
    }

    /**
     * 만료 PREMIUM 통과 결함 수정 검증.
     * plan=PREMIUM 이지만 expiresAt 가 과거(어제)면 만료로 보고 402 로 차단되어야 한다.
     */
    @Test
    @DisplayName("plan=PREMIUM 이지만 expiresAt 가 과거 → 402로 차단된다")
    void expired_premium_is_blocked() throws Throwable {
        UUID userId = UUID.randomUUID();
        authenticate(userId);

        Subscription expired = premiumExpiringAt(userId, now.minusDays(1));
        assertThat(expired.isPremium()).isTrue(); // plan 필드는 여전히 PREMIUM
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> planLimitAspect.checkPlan(joinPoint, null))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getHttpStatus())
                .isEqualTo(HttpStatus.PAYMENT_REQUIRED);

        verify(joinPoint, never()).proceed();
    }

    @Test
    @DisplayName("경계: expiresAt == now → 만료로 보고 402로 차단된다 (isAfter 엄격 비교)")
    void premium_expiring_exactly_now_is_blocked() throws Throwable {
        UUID userId = UUID.randomUUID();
        authenticate(userId);

        Subscription boundary = premiumExpiringAt(userId, now);
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.of(boundary));

        assertThatThrownBy(() -> planLimitAspect.checkPlan(joinPoint, null))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getHttpStatus())
                .isEqualTo(HttpStatus.PAYMENT_REQUIRED);

        verify(joinPoint, never()).proceed();
    }

    @Test
    @DisplayName("유효한 PREMIUM(expiresAt 미래) → 통과하여 대상 메서드가 실행된다")
    void active_premium_proceeds() throws Throwable {
        UUID userId = UUID.randomUUID();
        authenticate(userId);

        Subscription active = premiumExpiringAt(userId, now.plusDays(1));
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.of(active));
        when(joinPoint.proceed()).thenReturn("ok");

        Object result = planLimitAspect.checkPlan(joinPoint, null);

        assertThat(result).isEqualTo("ok");
        verify(joinPoint).proceed();
    }

    @Test
    @DisplayName("구독 없음 → 402로 차단된다")
    void no_subscription_is_blocked() throws Throwable {
        UUID userId = UUID.randomUUID();
        authenticate(userId);
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> planLimitAspect.checkPlan(joinPoint, null))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getHttpStatus())
                .isEqualTo(HttpStatus.PAYMENT_REQUIRED);

        verify(joinPoint, never()).proceed();
    }

    @Test
    @DisplayName("미인증(principal이 UUID 아님) → 401")
    void unauthenticated_is_rejected() throws Throwable {
        // SecurityContext 비어있음
        assertThatThrownBy(() -> planLimitAspect.checkPlan(joinPoint, null))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getHttpStatus())
                .isEqualTo(HttpStatus.UNAUTHORIZED);

        verify(joinPoint, never()).proceed();
    }
}
