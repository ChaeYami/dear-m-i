package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.subscription.Subscription;
import com.dearmi.backend.domain.subscription.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class SubscriptionRepositoryImpl implements SubscriptionRepository {

    private final SubscriptionJpaRepository jpa;

    @Override
    public Subscription save(Subscription subscription) {
        return jpa.save(subscription);
    }

    @Override
    public Optional<Subscription> findByUserId(UUID userId) {
        return jpa.findByUserId(userId);
    }

    @Override
    public List<Subscription> findExpiredPremiumSubscriptions(LocalDateTime now) {
        return jpa.findExpiredPremiumSubscriptions(now);
    }

    @Override
    public Optional<Subscription> findByOriginalTransactionId(String originalTransactionId) {
        return jpa.findByOriginalTransactionId(originalTransactionId);
    }
}
