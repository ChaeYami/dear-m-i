package com.dearmi.backend.presentation.subscription.dto;

import com.dearmi.backend.application.subscription.dto.SubscriptionResult;

import java.time.LocalDateTime;
import java.util.UUID;

public record SubscriptionResponse(
        UUID id,
        String plan,
        String paymentProvider,
        LocalDateTime startedAt,
        LocalDateTime expiresAt,
        Boolean autoRenew
) {
    public static SubscriptionResponse from(SubscriptionResult result) {
        return new SubscriptionResponse(
                result.id(),
                result.plan(),
                result.paymentProvider(),
                result.startedAt(),
                result.expiresAt(),
                result.autoRenew()
        );
    }
}
