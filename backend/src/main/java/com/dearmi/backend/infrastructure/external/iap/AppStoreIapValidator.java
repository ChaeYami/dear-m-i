package com.dearmi.backend.infrastructure.external.iap;

import com.apple.itunes.storekit.model.Environment;
import com.apple.itunes.storekit.model.JWSTransactionDecodedPayload;
import com.apple.itunes.storekit.model.NotificationTypeV2;
import com.apple.itunes.storekit.model.ResponseBodyV2DecodedPayload;
import com.apple.itunes.storekit.model.Subtype;
import com.apple.itunes.storekit.verification.SignedDataVerifier;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.Set;

/**
 * App Store Server API / JWS 영수증 서버 검증.
 *
 * 설정 env:
 *   APPLE_BUNDLE_ID          — 예: com.chloee0033.dearmiapp
 *   APPLE_APP_APPLE_ID       — App Store Connect 의 Apple ID(숫자). SignedDataVerifier 필수.
 *   APPLE_ENV                — 우선 시도 환경 힌트 (SANDBOX | PRODUCTION, 기본 PRODUCTION).
 *                              실패 시 반대 환경으로 자동 fallback 하므로 운영/리뷰 모두 동작.
 *   APPLE_ROOT_CERT_PATH     — Apple Root CA 인증서 경로 (classpath:apple-root-ca-g3.cer 기본)
 *
 * <p>중요: App Store reviewer 는 production 빌드에서 sandbox 영수증으로 테스트하므로
 * production / sandbox verifier 를 둘 다 인스턴스화해서 fallback 한다. 이게 누락되면
 * 리뷰 단계에서 2.1(b) IAP error 가 발생한다 (실제 v1.0(14) 빌드 거절 사유).
 */
@Slf4j
@Component
public class AppStoreIapValidator implements IapValidator {

    private final String bundleId;
    private final long appAppleId;
    private final String envName;
    private final String rootCertPath;

    private SignedDataVerifier productionVerifier;
    private SignedDataVerifier sandboxVerifier;
    // 운영 트래픽의 99% 는 production. envName 힌트로 우선 시도 순서를 정해 fallback 비용 절감.
    private boolean productionFirst = true;

    public AppStoreIapValidator(
            @Value("${iap.apple.bundle-id:}") String bundleId,
            // String 으로 수신 후 내부 파싱 — task def 에 실수로 ARN 등 비숫자가 들어와도
            // 빈 생성 단계에서 앱 전체가 죽지 않도록 방어.
            @Value("${iap.apple.app-apple-id:0}") String appAppleIdStr,
            @Value("${iap.apple.environment:PRODUCTION}") String envName,
            @Value("${iap.apple.root-cert-path:classpath:apple-root-ca-g3.cer}") String rootCertPath
    ) {
        this.bundleId = bundleId;
        long parsed;
        try {
            parsed = appAppleIdStr == null ? 0 : Long.parseLong(appAppleIdStr.trim());
        } catch (NumberFormatException e) {
            log.warn("[IAP] APPLE_APP_APPLE_ID is not numeric ('{}') — Apple validator will skip init",
                    appAppleIdStr);
            parsed = 0;
        }
        this.appAppleId = parsed;
        this.envName = envName;
        this.rootCertPath = rootCertPath;
    }

    @PostConstruct
    void init() {
        if (bundleId == null || bundleId.isBlank()) {
            log.warn("[IAP] APPLE_BUNDLE_ID not set — App Store receipt validation will fail");
            return;
        }
        if (appAppleId <= 0) {
            log.warn("[IAP] APPLE_APP_APPLE_ID not set — App Store receipt validation will fail");
            return;
        }
        try {
            // SignedDataVerifier 는 생성자에서 InputStream 을 소비하므로 환경마다 새로 로드.
            this.productionVerifier = new SignedDataVerifier(
                    loadRootCertificates(), bundleId, appAppleId, Environment.PRODUCTION, true);
            this.sandboxVerifier = new SignedDataVerifier(
                    loadRootCertificates(), bundleId, appAppleId, Environment.SANDBOX, true);

            this.productionFirst = !envName.equalsIgnoreCase("SANDBOX");

            log.info("[IAP] Apple validator initialized (bundle={}, productionFirst={})",
                    bundleId, productionFirst);
        } catch (Exception e) {
            log.error("[IAP] Failed to init Apple validator", e);
        }
    }

    /**
     * production / sandbox verifier 를 차례로 시도. 운영 빌드의 sandbox 리뷰어 시나리오 대응.
     * <p>두 환경 모두 실패하면 마지막 예외를 그대로 던진다.
     */
    private JWSTransactionDecodedPayload decodeTransactionWithFallback(String jws) throws Exception {
        SignedDataVerifier first = productionFirst ? productionVerifier : sandboxVerifier;
        SignedDataVerifier second = productionFirst ? sandboxVerifier : productionVerifier;
        try {
            return first.verifyAndDecodeTransaction(jws);
        } catch (Exception primary) {
            try {
                return second.verifyAndDecodeTransaction(jws);
            } catch (Exception fallback) {
                log.warn("[IAP] Apple JWS verification failed in both environments (first={}): {}",
                        productionFirst ? "PRODUCTION" : "SANDBOX", primary.getMessage());
                throw fallback;
            }
        }
    }

    private ResponseBodyV2DecodedPayload decodeNotificationWithFallback(String signedPayload) throws Exception {
        SignedDataVerifier first = productionFirst ? productionVerifier : sandboxVerifier;
        SignedDataVerifier second = productionFirst ? sandboxVerifier : productionVerifier;
        try {
            return first.verifyAndDecodeNotification(signedPayload);
        } catch (Exception primary) {
            try {
                return second.verifyAndDecodeNotification(signedPayload);
            } catch (Exception fallback) {
                log.warn("[IAP] Apple notification verification failed in both environments: {}",
                        primary.getMessage());
                throw fallback;
            }
        }
    }

    private Set<InputStream> loadRootCertificates() throws IOException {
        // classpath 또는 파일 경로 지원. 기본은 리소스에 번들된 apple-root-ca-g3.cer.
        Set<InputStream> streams = new HashSet<>();
        InputStream is;
        if (rootCertPath.startsWith("classpath:")) {
            String path = rootCertPath.substring("classpath:".length());
            is = new ClassPathResource(path).getInputStream();
        } else {
            is = new java.io.FileInputStream(rootCertPath);
        }
        streams.add(is);
        return streams;
    }

    @Override
    public ValidationResult validate(String productId, String transactionId, String receiptData) {
        if (productionVerifier == null || sandboxVerifier == null) {
            log.error("[IAP] Apple validator not initialized — missing credentials");
            throw new CustomException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }

        try {
            JWSTransactionDecodedPayload payload = decodeTransactionWithFallback(receiptData);

            if (!bundleId.equals(payload.getBundleId())) {
                log.warn("[IAP] Apple bundleId mismatch: expected={}, got={}", bundleId, payload.getBundleId());
                throw new CustomException(ErrorCode.INVALID_REQUEST);
            }
            if (!productId.equals(payload.getProductId())) {
                log.warn("[IAP] Apple productId mismatch: expected={}, got={}", productId, payload.getProductId());
                throw new CustomException(ErrorCode.INVALID_REQUEST);
            }

            Long expiresMs = payload.getExpiresDate();
            if (expiresMs == null) {
                log.warn("[IAP] Apple payload missing expiresDate: txn={}", transactionId);
                throw new CustomException(ErrorCode.INVALID_REQUEST);
            }

            LocalDateTime expiresAt = LocalDateTime.ofInstant(
                    Instant.ofEpochMilli(expiresMs), ZoneId.systemDefault());

            String originalTxnId = payload.getOriginalTransactionId() != null
                    ? payload.getOriginalTransactionId()
                    : transactionId;

            // auto-renew 상태는 SubscriptionStatus API 로 별도 조회 필요 — 기본 true 가정
            return new ValidationResult(expiresAt, true, originalTxnId);

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("[IAP] Apple JWS verification failed: txn={}", transactionId, e);
            throw new CustomException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }
    }

    /**
     * Apple Server-to-Server 알림 JWS 검증 후 핵심 필드 반환.
     * notificationType / subtype / originalTransactionId / expiresAt(nullable).
     */
    public NotificationResult verifyAndDecodeNotification(String signedPayload) {
        if (productionVerifier == null || sandboxVerifier == null) {
            log.error("[Apple Webhook] verifier not initialized");
            throw new CustomException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }
        try {
            ResponseBodyV2DecodedPayload notification = decodeNotificationWithFallback(signedPayload);

            NotificationTypeV2 type = notification.getNotificationType();
            Subtype subtype = notification.getSubtype();
            String notificationUuid = notification.getNotificationUUID();

            var data = notification.getData();
            if (data == null) {
                log.warn("[Apple Webhook] notification data null: type={}", type);
                return new NotificationResult(notificationUuid, type, subtype, null, null);
            }

            String signedTxn = data.getSignedTransactionInfo();
            if (signedTxn == null) {
                return new NotificationResult(notificationUuid, type, subtype, null, null);
            }

            JWSTransactionDecodedPayload txn = decodeTransactionWithFallback(signedTxn);
            String originalTxnId = txn.getOriginalTransactionId();

            LocalDateTime expiresAt = null;
            if (txn.getExpiresDate() != null) {
                expiresAt = LocalDateTime.ofInstant(
                        Instant.ofEpochMilli(txn.getExpiresDate()), ZoneId.systemDefault());
            }

            return new NotificationResult(notificationUuid, type, subtype, originalTxnId, expiresAt);

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("[Apple Webhook] notification decode failed", e);
            throw new CustomException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }
    }

    public record NotificationResult(
            String notificationUuid,
            NotificationTypeV2 type,
            Subtype subtype,
            String originalTransactionId,
            LocalDateTime expiresAt
    ) {}
}
