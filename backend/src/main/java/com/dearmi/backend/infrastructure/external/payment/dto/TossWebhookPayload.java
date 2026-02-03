package com.dearmi.backend.infrastructure.external.payment.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * 토스페이먼츠 웹훅 수신 페이로드.
 * eventType: PAYMENT_STATUS_CHANGED
 * data.status: DONE | CANCELED | PARTIAL_CANCELED
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record TossWebhookPayload(
        String eventType,
        String createdAt,
        Data data
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Data(
            String paymentKey,
            String orderId,
            String status
    ) {}
}
