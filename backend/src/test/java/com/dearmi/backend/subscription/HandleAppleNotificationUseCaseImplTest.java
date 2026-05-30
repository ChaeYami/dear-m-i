package com.dearmi.backend.subscription;

import com.apple.itunes.storekit.model.NotificationTypeV2;
import com.dearmi.backend.application.subscription.usecase.HandleAppleNotificationUseCaseImpl;
import com.dearmi.backend.domain.subscription.*;
import com.dearmi.backend.infrastructure.external.iap.AppStoreIapValidator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HandleAppleNotificationUseCaseImplTest {

    @Mock private AppStoreIapValidator appStoreIapValidator;
    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private SubscriptionHistoryRepository subscriptionHistoryRepository;
    @Mock private ProcessedAppleNotificationRepository processedAppleNotificationRepository;

    @InjectMocks
    private HandleAppleNotificationUseCaseImpl handleAppleNotificationUseCase;

    /**
     * 멱등성 검증.
     *
     * Apple Server-to-Server 알림은 at-least-once 전달이라 동일 SUBSCRIBED 알림이
     * 두 번 도착할 수 있다. dedup(notificationUUID) 이 없으면:
     *   1회차: FREE → SUBSCRIBED 이력 기록 + PREMIUM 활성화
     *   2회차: 이미 PREMIUM → isPremium()=true 분기로 빠져 RENEWED 로 "오기록"
     *
     * notificationUUID 기반 dedup 적용 후에는 2회차가 skip 되어 이력은 SUBSCRIBED 1건만 남아야 한다.
     */
    @Test
    @DisplayName("동일 SUBSCRIBED 알림 2회 수신 → 이력은 SUBSCRIBED 1건만 기록되어야 한다 (멱등성)")
    void duplicate_subscribed_notification_is_recorded_only_once() {
        UUID userId = UUID.randomUUID();
        String originalTxnId = "apple-original-txn-001";
        LocalDateTime expiresAt = LocalDateTime.now().plusYears(1);

        // FREE 상태에서 시작하는 구독 — findByOriginalTransactionId 가 같은 인스턴스를
        // 두 번 반환한다(실제 DB 재조회와 동일하게 1회차 호출이 이 객체를 PREMIUM 으로 변경).
        Subscription subscription = Subscription.builder().userId(userId).build();

        String notificationUuid = "notif-uuid-001";
        AppStoreIapValidator.NotificationResult subscribed = new AppStoreIapValidator.NotificationResult(
                notificationUuid, NotificationTypeV2.SUBSCRIBED, null, originalTxnId, expiresAt);

        when(appStoreIapValidator.verifyAndDecodeNotification(any())).thenReturn(subscribed);
        // 1회차: 미처리(false) → 처리, 2회차: 이미 처리(true) → skip
        when(processedAppleNotificationRepository.existsByNotificationUuid(notificationUuid))
                .thenReturn(false, true);
        when(subscriptionRepository.findByOriginalTransactionId(originalTxnId))
                .thenReturn(Optional.of(subscription));
        when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(subscriptionHistoryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // 동일 알림 2회 수신
        handleAppleNotificationUseCase.handle("signed-payload-A");
        handleAppleNotificationUseCase.handle("signed-payload-A");

        // 저장된 모든 이력을 포착 (현재는 2건 저장됨)
        ArgumentCaptor<SubscriptionHistory> captor = ArgumentCaptor.forClass(SubscriptionHistory.class);
        verify(subscriptionHistoryRepository, atLeastOnce()).save(captor.capture());
        List<SubscriptionHistory> histories = captor.getAllValues();

        // 멱등성 기대치: SUBSCRIBED 이력 1건. (현재 RED — 2건이며 두 번째가 RENEWED)
        assertThat(histories).hasSize(1);
        assertThat(histories.get(0).getEvent()).isEqualTo(SubscriptionEventType.SUBSCRIBED.name());
    }
}
