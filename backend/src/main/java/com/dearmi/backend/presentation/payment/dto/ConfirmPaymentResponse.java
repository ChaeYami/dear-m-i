package com.dearmi.backend.presentation.payment.dto;

import com.dearmi.backend.application.payment.dto.ConfirmPaymentResult;

import java.time.LocalDateTime;

public record ConfirmPaymentResponse(
        boolean success,
        String plan,
        LocalDateTime expiresAt
) {
    public static ConfirmPaymentResponse from(ConfirmPaymentResult result) {
        return new ConfirmPaymentResponse(true, result.plan(), result.expiresAt());
    }
}
