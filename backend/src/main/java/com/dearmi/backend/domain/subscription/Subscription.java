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

    public boolean isPremium() {
        return SubscriptionPlan.PREMIUM.name().equals(this.plan);
    }

    public void upgradeToPremium(LocalDateTime startedAt, LocalDateTime expiresAt) {
        this.plan = SubscriptionPlan.PREMIUM.name();
        this.startedAt = startedAt;
        this.expiresAt = expiresAt;
    }

    public void expireToFree() {
        this.plan = SubscriptionPlan.FREE.name();
        this.expiresAt = null;
    }
}
