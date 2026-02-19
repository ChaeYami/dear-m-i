package com.dearmi.backend.presentation.subscription.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * IAP 영수증 검증 요청.
 *
 * App Store: receiptData 는 JWS signedTransactionInfo (react-native-iap 의 purchaseToken).
 *   SDK 가 JWS 서명 검증 + 페이로드에서 expiresDate / originalTransactionId 추출.
 * Play Store: receiptData 는 purchaseToken. productId 와 함께 AndroidPublisher API 로
 *   subscriptionsv2.get(packageName, token) 호출.
 */
public record VerifyIapRequest(
        @NotBlank String productId,               // com.dearmi.premium.{monthly|yearly}
        @NotBlank String originalTransactionId,
        @NotBlank String receiptData              // iOS: JWS, Android: purchaseToken
) {}
