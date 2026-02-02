package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.subscription.SubscriptionHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SubscriptionHistoryJpaRepository extends JpaRepository<SubscriptionHistory, UUID> {

    List<SubscriptionHistory> findByUserIdOrderByStartedAtDesc(UUID userId);
}
