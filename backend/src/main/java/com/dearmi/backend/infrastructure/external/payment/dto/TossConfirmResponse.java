package com.dearmi.backend.infrastructure.external.payment.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * 토스페이먼츠 결제 승인 응답 DTO.
 * 실제 응답에는 더 많은 필드가 있으나 필요한 것만 매핑.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record TossConfirmResponse(
        String paymentKey,
        String orderId,
        String status,        // DONE | CANCELED | PARTIAL_CANCELED 등
        int totalAmount,
        String approvedAt
) {}
