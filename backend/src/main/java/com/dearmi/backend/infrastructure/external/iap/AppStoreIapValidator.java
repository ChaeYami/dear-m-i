package com.dearmi.backend.infrastructure.external.iap;

import com.apple.itunes.storekit.model.Environment;
import com.apple.itunes.storekit.model.JWSTransactionDecodedPayload;
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
 *   APPLE_ENV                — SANDBOX | PRODUCTION (기본 SANDBOX)
 *   APPLE_ROOT_CERT_PATH     — Apple Root CA 인증서 경로 (classpath:apple-root-ca-g3.cer 기본)
 *
 * 클라가 보낸 receiptData(JWS signedTransactionInfo) 를 SignedDataVerifier 로
 * 서명/체인 검증 후 페이로드의 expiresDate 추출.
 */
@Slf4j
@Component
public class AppStoreIapValidator implements IapValidator {

    private final String bundleId;
    private final long appAppleId;
    private final String envName;
    private final String rootCertPath;

    private SignedDataVerifier verifier;

    public AppStoreIapValidator(
            @Value("${iap.apple.bundle-id:}") String bundleId,
            // String 으로 수신 후 내부 파싱 — task def 에 실수로 ARN 등 비숫자가 들어와도
            // 빈 생성 단계에서 앱 전체가 죽지 않도록 방어.
            @Value("${iap.apple.app-apple-id:0}") String appAppleIdStr,
            @Value("${iap.apple.environment:SANDBOX}") String envName,
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
            Set<java.io.InputStream> roots = loadRootCertificates();
            Environment env = envName.equalsIgnoreCase("PRODUCTION")
                    ? Environment.PRODUCTION
                    : Environment.SANDBOX;

            this.verifier = new SignedDataVerifier(
                    roots,
                    bundleId,
                    appAppleId,
                    env,
                    true  // enableOnlineChecks — 인증서 OCSP/CRL 체크
            );

            log.info("[IAP] Apple validator initialized (bundle={}, env={})", bundleId, env);
        } catch (Exception e) {
            log.error("[IAP] Failed to init Apple validator", e);
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
        if (verifier == null) {
            log.error("[IAP] Apple validator not initialized — missing credentials");
            throw new CustomException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }

        try {
            JWSTransactionDecodedPayload payload =
                    verifier.verifyAndDecodeTransaction(receiptData);

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

}
