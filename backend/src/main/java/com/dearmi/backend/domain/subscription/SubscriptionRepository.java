package com.dearmi.backend.domain.subscription;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubscriptionRepository {

    Subscription save(Subscription subscription);

    Optional<Subscription> findByUserId(UUID userId);

    /** 만료된 프리미엄 구독 목록 (배치 다운그레이드용) */
    List<Subscription> findExpiredPremiumSubscriptions(LocalDateTime now);
}
