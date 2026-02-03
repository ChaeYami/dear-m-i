package com.dearmi.backend.application.payment.dto;

public record PreparePaymentResult(
        String orderId,
        int amount,
        String customerName,
        String customerEmail
) {}
