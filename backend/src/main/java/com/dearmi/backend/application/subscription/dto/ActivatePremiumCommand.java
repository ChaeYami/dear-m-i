package com.dearmi.backend.application.subscription.dto;

import com.dearmi.backend.domain.subscription.PaymentProvider;

import java.time.LocalDateTime;
import java.util.UUID;

public record ActivatePremiumCommand(
        UUID userId,
        PaymentProvider provider,
        String originalTransactionId,
        LocalDateTime expiresAt
) {}
