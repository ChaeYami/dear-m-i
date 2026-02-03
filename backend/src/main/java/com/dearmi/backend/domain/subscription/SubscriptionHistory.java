package com.dearmi.backend.domain.subscription;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "subscription_histories")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
@EntityListeners(AuditingEntityListener.class)
public class SubscriptionHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Column(length = 20, nullable = false)
    private String plan;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    /** SUBSCRIBED | RENEWED | CANCELLED | EXPIRED */
    @Column(name = "event", length = 50)
    private String event;

    @Column(name = "payment_provider", length = 20)
    private String paymentProvider;

    private Integer amount;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public static SubscriptionHistory ofEvent(UUID userId, SubscriptionEventType eventType,
                                              String plan, PaymentProvider provider, Integer amount) {
        return SubscriptionHistory.builder()
                .userId(userId)
                .plan(plan)
                .startedAt(LocalDateTime.now())
                .event(eventType.name())
                .paymentProvider(provider != null ? provider.name() : null)
                .amount(amount)
                .build();
    }
}
