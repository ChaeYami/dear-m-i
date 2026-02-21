package com.dearmi.backend.application.subscription.usecase;

import com.apple.itunes.storekit.model.NotificationTypeV2;
import com.apple.itunes.storekit.model.Subtype;
import com.dearmi.backend.domain.subscription.*;
import com.dearmi.backend.infrastructure.external.iap.AppStoreIapValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class HandleAppleNotificationUseCaseImpl implements HandleAppleNotificationUseCase {

    private final AppStoreIapValidator appStoreIapValidator;
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionHistoryRepository subscriptionHistoryRepository;

    @Override
    @Transactional
    public void handle(String signedPayload) {
        AppStoreIapValidator.NotificationResult result;
        try {
            result = appStoreIapValidator.verifyAndDecodeNotification(signedPayload);
        } catch (Exception e) {
            log.error("[Apple Webhook] 검증 실패 — 무시", e);
            return;
        }

        NotificationTypeV2 type = result.type();
        String originalTxnId = result.originalTransactionId();

        log.info("[Apple Webhook] type={}, subtype={}, originalTxnId={}", type, result.subtype(), originalTxnId);

        if (originalTxnId == null) {
            log.warn("[Apple Webhook] originalTransactionId 없음 — 무시");
            return;
        }

        subscriptionRepository.findByOriginalTransactionId(originalTxnId).ifPresentOrElse(subscription -> {
            if (isActivateEvent(type)) {
                activate(subscription, result);
            } else if (isExpireEvent(type)) {
                expire(subscription, type);
            } else if (type == NotificationTypeV2.DID_CHANGE_RENEWAL_STATUS
                    && result.subtype() == Subtype.AUTO_RENEW_DISABLED) {
                subscription.cancelAutoRenew();
                subscriptionRepository.save(subscription);
                log.info("[Apple Webhook] auto_renew 해제: originalTxnId={}", originalTxnId);
            } else {
                log.info("[Apple Webhook] 처리 불필요한 이벤트 — 무시: type={}", type);
            }
        }, () -> log.warn("[Apple Webhook] 구독 레코드 없음: originalTxnId={}", originalTxnId));
    }

    private boolean isActivateEvent(NotificationTypeV2 type) {
        return type == NotificationTypeV2.SUBSCRIBED || type == NotificationTypeV2.DID_RENEW;
    }

    private boolean isExpireEvent(NotificationTypeV2 type) {
        return type == NotificationTypeV2.EXPIRED
                || type == NotificationTypeV2.REFUND
                || type == NotificationTypeV2.REVOKE;
    }

    private void activate(Subscription subscription, AppStoreIapValidator.NotificationResult result) {
        LocalDateTime expiresAt = result.expiresAt();
        if (expiresAt == null) {
            log.warn("[Apple Webhook] activate 이벤트인데 expiresAt 없음 — 무시");
            return;
        }

        SubscriptionEventType eventType = subscription.isPremium()
                ? SubscriptionEventType.RENEWED
                : SubscriptionEventType.SUBSCRIBED;

        subscription.activatePremium(PaymentProvider.APP_STORE, result.originalTransactionId(), expiresAt);
        subscriptionRepository.save(subscription);

        subscriptionHistoryRepository.save(
                SubscriptionHistory.ofEvent(
                        subscription.getUserId(), eventType,
                        SubscriptionPlan.PREMIUM.name(), PaymentProvider.APP_STORE, null));

        log.info("[Apple Webhook] 프리미엄 활성화: event={}, expiresAt={}", eventType, expiresAt);
    }

    private void expire(Subscription subscription, NotificationTypeV2 type) {
        if (!subscription.isPremium()) {
            log.info("[Apple Webhook] 이미 FREE — 무시: type={}", type);
            return;
        }
        subscription.expireToFree();
        subscriptionRepository.save(subscription);

        subscriptionHistoryRepository.save(
                SubscriptionHistory.ofEvent(
                        subscription.getUserId(), SubscriptionEventType.EXPIRED,
                        SubscriptionPlan.FREE.name(), PaymentProvider.APP_STORE, null));

        log.info("[Apple Webhook] 구독 만료 처리: type={}", type);
    }
}
