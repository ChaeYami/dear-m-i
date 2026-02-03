package com.dearmi.backend.presentation.subscription.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifyIapRequest(
        @NotBlank String originalTransactionId,
        String receiptData    // App Store: base64 영수증, Play Store: purchaseToken
) {}
