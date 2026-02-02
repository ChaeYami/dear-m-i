package com.dearmi.backend.domain.subscription;

import java.util.List;
import java.util.UUID;

public interface SubscriptionHistoryRepository {

    SubscriptionHistory save(SubscriptionHistory history);

    List<SubscriptionHistory> findByUserIdOrderByStartedAtDesc(UUID userId);
}
