package com.dearmi.backend.application.subscription.dto;

import com.dearmi.backend.domain.subscription.Subscription;

import java.time.LocalDateTime;
import java.util.UUID;

public record SubscriptionResult(
        UUID id,
        String plan,
        String paymentProvider,
        LocalDateTime startedAt,
        LocalDateTime expiresAt,
        Boolean autoRenew
) {
    public static SubscriptionResult from(Subscription sub) {
        return new SubscriptionResult(
                sub.getId(),
                sub.getPlan(),
                sub.getPaymentProvider(),
                sub.getStartedAt(),
                sub.getExpiresAt(),
                sub.getAutoRenew()
        );
    }

    public static SubscriptionResult free(UUID userId) {
        return new SubscriptionResult(null, "FREE", null, null, null, null);
    }
}
