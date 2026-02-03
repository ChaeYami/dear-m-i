package com.dearmi.backend.presentation.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record ConfirmPaymentRequest(
        @NotBlank String orderId,
        @NotBlank String paymentKey,
        @Positive int amount
) {}
