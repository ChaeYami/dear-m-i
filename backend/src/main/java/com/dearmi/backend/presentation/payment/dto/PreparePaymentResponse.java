package com.dearmi.backend.presentation.payment.dto;

import com.dearmi.backend.application.payment.dto.PreparePaymentResult;

public record PreparePaymentResponse(
        String orderId,
        int amount,
        String customerName,
        String customerEmail
) {
    public static PreparePaymentResponse from(PreparePaymentResult result) {
        return new PreparePaymentResponse(
                result.orderId(),
                result.amount(),
                result.customerName(),
                result.customerEmail()
        );
    }
}
