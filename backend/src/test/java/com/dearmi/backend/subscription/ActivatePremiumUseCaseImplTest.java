package com.dearmi.backend.subscription;

import com.dearmi.backend.application.subscription.dto.ActivatePremiumCommand;
import com.dearmi.backend.application.subscription.dto.SubscriptionResult;
import com.dearmi.backend.application.subscription.usecase.ActivatePremiumUseCaseImpl;
import com.dearmi.backend.domain.subscription.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActivatePremiumUseCaseImplTest {

    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private SubscriptionHistoryRepository subscriptionHistoryRepository;

    @InjectMocks
    private ActivatePremiumUseCaseImpl activatePremiumUseCase;

    @Test
    @DisplayName("신규 구독: SUBSCRIBED 이벤트 기록 및 PREMIUM 활성화")
    void new_subscription_records_subscribed_event() {
        UUID userId = UUID.randomUUID();
        LocalDateTime expiresAt = LocalDateTime.now().plusYears(1);

        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.empty());
        when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(subscriptionHistoryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ActivatePremiumCommand command = new ActivatePremiumCommand(
                userId, PaymentProvider.APP_STORE, "txn-001", expiresAt);

        SubscriptionResult result = activatePremiumUseCase.activate(command);

        assertThat(result.plan()).isEqualTo("PREMIUM");
        assertThat(result.paymentProvider()).isEqualTo("APP_STORE");

        ArgumentCaptor<SubscriptionHistory> historyCaptor = ArgumentCaptor.forClass(SubscriptionHistory.class);
        verify(subscriptionHistoryRepository).save(historyCaptor.capture());
        assertThat(historyCaptor.getValue().getEvent()).isEqualTo(SubscriptionEventType.SUBSCRIBED.name());
    }

    @Test
    @DisplayName("갱신: 이미 PREMIUM인 경우 RENEWED 이벤트 기록")
    void renewal_records_renewed_event() {
        UUID userId = UUID.randomUUID();
        Subscription existing = Subscription.builder().userId(userId).build();
        existing.activatePremium(PaymentProvider.APP_STORE, "old-txn", LocalDateTime.now().plusDays(10));

        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.of(existing));
        when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(subscriptionHistoryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        activatePremiumUseCase.activate(new ActivatePremiumCommand(
                userId, PaymentProvider.APP_STORE, "new-txn", LocalDateTime.now().plusYears(1)));

        ArgumentCaptor<SubscriptionHistory> historyCaptor = ArgumentCaptor.forClass(SubscriptionHistory.class);
        verify(subscriptionHistoryRepository).save(historyCaptor.capture());
        assertThat(historyCaptor.getValue().getEvent()).isEqualTo(SubscriptionEventType.RENEWED.name());
    }

    @Test
    @DisplayName("originalTransactionId가 구독에 저장된다")
    void original_transaction_id_is_saved() {
        UUID userId = UUID.randomUUID();
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.empty());
        when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(subscriptionHistoryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        activatePremiumUseCase.activate(new ActivatePremiumCommand(
                userId, PaymentProvider.PLAY_STORE, "play-txn-xyz", LocalDateTime.now().plusYears(1)));

        ArgumentCaptor<Subscription> subCaptor = ArgumentCaptor.forClass(Subscription.class);
        verify(subscriptionRepository).save(subCaptor.capture());
        assertThat(subCaptor.getValue().getOriginalTransactionId()).isEqualTo("play-txn-xyz");
        assertThat(subCaptor.getValue().getPaymentProvider()).isEqualTo("PLAY_STORE");
    }
}
