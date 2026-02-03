package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.subscription.SubscriptionHistory;
import com.dearmi.backend.domain.subscription.SubscriptionHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class SubscriptionHistoryRepositoryImpl implements SubscriptionHistoryRepository {

    private final SubscriptionHistoryJpaRepository jpa;

    @Override
    public SubscriptionHistory save(SubscriptionHistory history) {
        return jpa.save(history);
    }

    @Override
    public List<SubscriptionHistory> findByUserIdOrderByStartedAtDesc(UUID userId) {
        return jpa.findByUserIdOrderByStartedAtDesc(userId);
    }
}
