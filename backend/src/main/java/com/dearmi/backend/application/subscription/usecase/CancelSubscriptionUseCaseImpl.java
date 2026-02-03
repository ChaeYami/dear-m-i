package com.dearmi.backend.application.subscription.usecase;

import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.subscription.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CancelSubscriptionUseCaseImpl implements CancelSubscriptionUseCase {

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionHistoryRepository subscriptionHistoryRepository;

    @Override
    @Transactional
    public void cancel(UUID userId) {
        Subscription subscription = subscriptionRepository.findByUserId(userId)
                .filter(Subscription::isPremium)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND,
                        "활성 프리미엄 구독이 없습니다."));

        subscription.cancelAutoRenew();
        subscriptionRepository.save(subscription);

        subscriptionHistoryRepository.save(
                SubscriptionHistory.ofEvent(userId, SubscriptionEventType.CANCELLED,
                        SubscriptionPlan.PREMIUM.name(), null, null));
    }
}
