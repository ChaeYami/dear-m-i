package com.dearmi.backend.infrastructure.external.payment.dto;

public record TossConfirmRequest(
        String orderId,
        String paymentKey,
        int amount
) {}
