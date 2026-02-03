package com.dearmi.backend.application.payment.dto;

import java.time.LocalDateTime;

public record ConfirmPaymentResult(
        String plan,
        LocalDateTime expiresAt
) {}
