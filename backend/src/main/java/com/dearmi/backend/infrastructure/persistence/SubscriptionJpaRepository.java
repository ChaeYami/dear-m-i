package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.subscription.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubscriptionJpaRepository extends JpaRepository<Subscription, UUID> {

    Optional<Subscription> findByUserId(UUID userId);

    @Query("SELECT s FROM Subscription s WHERE s.plan = 'PREMIUM' AND s.expiresAt IS NOT NULL AND s.expiresAt < :now")
    List<Subscription> findExpiredPremiumSubscriptions(@Param("now") LocalDateTime now);
}
