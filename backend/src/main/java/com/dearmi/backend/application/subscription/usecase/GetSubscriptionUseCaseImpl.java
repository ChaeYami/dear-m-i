package com.dearmi.backend.application.subscription.usecase;

import com.dearmi.backend.application.subscription.dto.SubscriptionResult;
import com.dearmi.backend.domain.subscription.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetSubscriptionUseCaseImpl implements GetSubscriptionUseCase {

    private final SubscriptionRepository subscriptionRepository;

    @Override
    @Transactional(readOnly = true)
    public SubscriptionResult get(UUID userId) {
        return subscriptionRepository.findByUserId(userId)
                .map(SubscriptionResult::from)
                .orElseGet(() -> SubscriptionResult.free(userId));
    }
}
