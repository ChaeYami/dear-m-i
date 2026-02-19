package com.dearmi.backend.infrastructure.external.iap;

import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.androidpublisher.AndroidPublisher;
import com.google.api.services.androidpublisher.AndroidPublisherScopes;
import com.google.api.services.androidpublisher.model.SubscriptionPurchaseV2;
import com.google.api.services.androidpublisher.model.SubscriptionPurchaseLineItem;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;

/**
 * Google Play Developer API 로 구독 영수증 검증.
 *
 * 설정 env:
 *   PLAY_DEVELOPER_API_JSON  — 서비스 계정 JSON 전체 문자열 (SecretsManager 주입 권장)
 *   PLAY_PACKAGE_NAME        — 앱 패키지명 (예: com.chloee0033.dearmiapp)
 *
 * JSON 이 비어있으면 lazy 초기화 실패를 validate() 시점에 던진다 — 앱 부팅 차단은 안 함.
 */
@Slf4j
@Component
public class GooglePlayIapValidator implements IapValidator {

    private final String serviceAccountJson;
    private final String packageName;

    private AndroidPublisher androidPublisher;

    public GooglePlayIapValidator(
            @Value("${iap.play.service-account-json:}") String serviceAccountJson,
            @Value("${iap.play.package-name:}") String packageName
    ) {
        this.serviceAccountJson = serviceAccountJson;
        this.packageName = packageName;
    }

    @PostConstruct
    void init() {
        if (serviceAccountJson == null || serviceAccountJson.isBlank()) {
            log.warn("[IAP] PLAY_DEVELOPER_API_JSON not set — Play Store receipt validation will fail");
            return;
        }
        if (packageName == null || packageName.isBlank()) {
            log.warn("[IAP] PLAY_PACKAGE_NAME not set — Play Store receipt validation will fail");
            return;
        }
        try {
            HttpTransport transport = GoogleNetHttpTransport.newTrustedTransport();
            GoogleCredentials credentials = GoogleCredentials
                    .fromStream(new ByteArrayInputStream(serviceAccountJson.getBytes(StandardCharsets.UTF_8)))
                    .createScoped(Collections.singleton(AndroidPublisherScopes.ANDROIDPUBLISHER));

            this.androidPublisher = new AndroidPublisher.Builder(
                    transport,
                    GsonFactory.getDefaultInstance(),
                    new HttpCredentialsAdapter(credentials)
            ).setApplicationName("dearmi-backend").build();

            log.info("[IAP] Google Play validator initialized (package={})", packageName);
        } catch (Exception e) {
            log.error("[IAP] Failed to init Google Play validator", e);
            this.androidPublisher = null;
        }
    }

    @Override
    public ValidationResult validate(String productId, String transactionId, String receiptData) {
        if (androidPublisher == null) {
            log.error("[IAP] Play validator not initialized — missing credentials");
            throw new CustomException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }

        try {
            SubscriptionPurchaseV2 purchase = androidPublisher
                    .purchases()
                    .subscriptionsv2()
                    .get(packageName, receiptData)
                    .execute();

            // subscriptionState: SUBSCRIPTION_STATE_ACTIVE / IN_GRACE_PERIOD / CANCELED / ...
            String state = purchase.getSubscriptionState();
            if (state == null ||
                    !(state.equals("SUBSCRIPTION_STATE_ACTIVE")
                            || state.equals("SUBSCRIPTION_STATE_IN_GRACE_PERIOD")
                            || state.equals("SUBSCRIPTION_STATE_CANCELED"))) {
                // CANCELED 도 만료 전까지는 유효하므로 허용. EXPIRED/REVOKED 는 거절.
                log.warn("[IAP] Play subscription not active: state={}, txn={}", state, transactionId);
                throw new CustomException(ErrorCode.INVALID_REQUEST);
            }

            List<SubscriptionPurchaseLineItem> items = purchase.getLineItems();
            if (items == null || items.isEmpty()) {
                throw new CustomException(ErrorCode.INVALID_REQUEST);
            }

            // productId 일치 검증
            boolean productMatch = items.stream().anyMatch(it -> productId.equals(it.getProductId()));
            if (!productMatch) {
                log.warn("[IAP] Play productId mismatch: expected={}, got={}", productId,
                        items.stream().map(SubscriptionPurchaseLineItem::getProductId).toList());
                throw new CustomException(ErrorCode.INVALID_REQUEST);
            }

            String expiryTimeStr = items.get(0).getExpiryTime();  // RFC 3339
            LocalDateTime expiresAt = OffsetDateTime.parse(expiryTimeStr)
                    .atZoneSameInstant(ZoneId.systemDefault())
                    .toLocalDateTime();

            boolean autoRenewing = Boolean.TRUE.equals(
                    purchase.getSubscriptionState().equals("SUBSCRIPTION_STATE_ACTIVE")
                            && items.get(0).getAutoRenewingPlan() != null
                            && Boolean.TRUE.equals(items.get(0).getAutoRenewingPlan().getAutoRenewEnabled())
            );

            // Play 는 originalTransactionId 개념이 약해 purchaseToken 을 그대로 사용
            return new ValidationResult(expiresAt, autoRenewing, transactionId);

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("[IAP] Play subscription verification failed: txn={}", transactionId, e);
            throw new CustomException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }
    }
}
