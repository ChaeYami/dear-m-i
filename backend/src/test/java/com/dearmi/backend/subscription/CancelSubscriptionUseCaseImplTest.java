package com.dearmi.backend.subscription;

import com.dearmi.backend.application.subscription.usecase.CancelSubscriptionUseCaseImpl;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CancelSubscriptionUseCaseImplTest {

    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private SubscriptionHistoryRepository subscriptionHistoryRepository;

    @InjectMocks
    private CancelSubscriptionUseCaseImpl cancelSubscriptionUseCase;

    @Test
    @DisplayName("PREMIUM 구독의 auto_renew를 false로 설정하고 CANCELLED 이벤트를 기록한다")
    void cancel_sets_auto_renew_false_and_records_cancelled() {
        UUID userId = UUID.randomUUID();
        Subscription sub = Subscription.builder().userId(userId).build();
        sub.activatePremium(PaymentProvider.APP_STORE, "txn-001", LocalDateTime.now().plusMonths(6));

        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.of(sub));
        when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(subscriptionHistoryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        cancelSubscriptionUseCase.cancel(userId);

        assertThat(sub.getAutoRenew()).isFalse();
        assertThat(sub.isPremium()).isTrue(); // 기간 만료까지는 PREMIUM 유지

        ArgumentCaptor<SubscriptionHistory> historyCaptor = ArgumentCaptor.forClass(SubscriptionHistory.class);
        verify(subscriptionHistoryRepository).save(historyCaptor.capture());
        assertThat(historyCaptor.getValue().getEvent()).isEqualTo(SubscriptionEventType.CANCELLED.name());
    }

    @Test
    @DisplayName("활성 PREMIUM이 없으면 NOT_FOUND 예외 발생")
    void cancel_without_active_premium_throws_not_found() {
        UUID userId = UUID.randomUUID();
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> cancelSubscriptionUseCase.cancel(userId))
                .isInstanceOf(CustomException.class)
                .satisfies(ex -> assertThat(((CustomException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.NOT_FOUND.getCode()));
    }
}
