package com.dearmi.backend.infrastructure.external.iap;

import java.time.LocalDateTime;

/**
 * IAP 영수증 서버 검증 공통 인터페이스.
 * 구현체: GooglePlayIapValidator, AppStoreIapValidator.
 */
public interface IapValidator {

    /**
     * 영수증을 스토어 서버에 검증하고 구독 정보 반환.
     *
     * @param productId         예: com.dearmi.premium.monthly
     * @param transactionId     iOS: originalTransactionId, Android: transactionId
     * @param receiptData       iOS: JWS signedTransactionInfo, Android: purchaseToken
     * @return 파싱된 구독 정보
     * @throws com.dearmi.backend.common.exception.CustomException 검증 실패 시
     */
    ValidationResult validate(String productId, String transactionId, String receiptData);

    record ValidationResult(
            LocalDateTime expiresAt,
            boolean autoRenewing,
            String originalTransactionId  // 서버 검증을 통해 확정된 값 (client 전달값과 다를 수 있음)
    ) {}
}
