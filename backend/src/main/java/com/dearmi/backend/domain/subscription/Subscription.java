package com.dearmi.backend.domain.subscription;

import com.dearmi.backend.common.entity.BaseTimestampEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;


@Entity
@Table(name = "subscriptions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Subscription extends BaseTimestampEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true, columnDefinition = "uuid")
    private UUID userId;

    @Column(length = 20, nullable = false)
    @Builder.Default
    private String plan = SubscriptionPlan.FREE.name();

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "payment_provider", length = 20)
    private String paymentProvider;

    @Column(name = "original_transaction_id", length = 500)
    private String originalTransactionId;

    @Column(name = "auto_renew", nullable = false)
    @Builder.Default
    private Boolean autoRenew = true;

    public boolean isPremium() {
        return SubscriptionPlan.PREMIUM.name().equals(this.plan);
    }

    /**
     * 기준 시각(now) 기준으로 "유효한" PREMIUM 인지 확인한다.
     * plan 이 PREMIUM 이어도 expiresAt 가 지났으면(만료 배치/웹훅이 아직 FREE 로 못 내린 상태) false.
     * 호출자가 Clock 으로부터 now 를 결정해 전달한다(도메인은 시간 소스에 의존하지 않음).
     */
    public boolean isActivePremium(LocalDateTime now) {
        return isPremium()
                && this.expiresAt != null
                && this.expiresAt.isAfter(now);
    }

    public void activatePremium(PaymentProvider provider, String transactionId, LocalDateTime expiresAt) {
        this.plan = SubscriptionPlan.PREMIUM.name();
        this.paymentProvider = provider.name();
        this.originalTransactionId = transactionId;
        this.startedAt = LocalDateTime.now();
        this.expiresAt = expiresAt;
        this.autoRenew = true;
    }

    public void cancelAutoRenew() {
        this.autoRenew = false;
    }

    public void expireToFree() {
        this.plan = SubscriptionPlan.FREE.name();
        this.expiresAt = null;
        this.autoRenew = false;
    }

    /** @deprecated 구독 활성화는 activatePremium(provider, transactionId, expiresAt) 사용 */
    @Deprecated
    public void upgradeToPremium(LocalDateTime startedAt, LocalDateTime expiresAt) {
        this.plan = SubscriptionPlan.PREMIUM.name();
        this.startedAt = startedAt;
        this.expiresAt = expiresAt;
    }
}
