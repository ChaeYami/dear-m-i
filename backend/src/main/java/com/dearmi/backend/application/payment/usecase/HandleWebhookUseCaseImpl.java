package com.dearmi.backend.application.payment.usecase;

import com.dearmi.backend.domain.payment.PaymentTempRepository;
import com.dearmi.backend.domain.subscription.*;
import com.dearmi.backend.infrastructure.external.payment.dto.TossWebhookPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class HandleWebhookUseCaseImpl implements HandleWebhookUseCase {

    private static final Set<String> CANCEL_STATUSES = Set.of("CANCELED", "PARTIAL_CANCELED");

    private final PaymentTempRepository paymentTempRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionHistoryRepository subscriptionHistoryRepository;

    @Override
    @Transactional
    public void handle(TossWebhookPayload payload) {
        if (payload.data() == null) {
            log.warn("[Webhook] 웹훅 data 없음: eventType={}", payload.eventType());
            return;
        }

        String status = payload.data().status();
        String orderId = payload.data().orderId();

        log.info("[Webhook] 수신: eventType={}, orderId={}, status={}", payload.eventType(), orderId, status);

        if (!CANCEL_STATUSES.contains(status)) {
            return; // DONE 등 취소 외 이벤트는 무시
        }

        // payments_temp에서 userId 조회 (COMPLETED 상태 레코드)
        paymentTempRepository.findByOrderId(orderId).ifPresentOrElse(temp -> {
            subscriptionRepository.findByUserId(temp.getUserId())
                    .filter(Subscription::isPremium)
                    .ifPresent(subscription -> {
                        subscription.expireToFree();
                        subscriptionRepository.save(subscription);

                        subscriptionHistoryRepository.save(
                                SubscriptionHistory.ofEvent(
                                        temp.getUserId(),
                                        SubscriptionEventType.CANCELLED,
                                        SubscriptionPlan.FREE.name(),
                                        null, null));

                        log.info("[Webhook] 결제 취소 처리 완료: userId={}, orderId={}",
                                temp.getUserId(), orderId);
                    });
        }, () -> log.warn("[Webhook] orderId에 해당하는 payments_temp 없음: orderId={}", orderId));
    }
}
