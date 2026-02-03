package com.dearmi.backend.application.payment.dto;

import java.util.UUID;

public record ConfirmPaymentCommand(
        UUID userId,
        String orderId,
        String paymentKey,
        int amount
) {}
