package com.dearmi.backend.application.subscription.usecase;

import com.dearmi.backend.application.subscription.dto.ActivatePremiumCommand;
import com.dearmi.backend.application.subscription.dto.SubscriptionResult;
import com.dearmi.backend.domain.subscription.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ActivatePremiumUseCaseImpl implements ActivatePremiumUseCase {

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionHistoryRepository subscriptionHistoryRepository;

    @Override
    @Transactional
    public SubscriptionResult activate(ActivatePremiumCommand command) {
        Subscription subscription = subscriptionRepository.findByUserId(command.userId())
                .orElseGet(() -> Subscription.builder().userId(command.userId()).build());

        SubscriptionEventType eventType = subscription.isPremium()
                ? SubscriptionEventType.RENEWED
                : SubscriptionEventType.SUBSCRIBED;

        subscription.activatePremium(command.provider(), command.originalTransactionId(), command.expiresAt());
        Subscription saved = subscriptionRepository.save(subscription);

        subscriptionHistoryRepository.save(
                SubscriptionHistory.ofEvent(command.userId(), eventType,
                        SubscriptionPlan.PREMIUM.name(), command.provider(), null));

        return SubscriptionResult.from(saved);
    }
}
