package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.subscription.ProcessedAppleNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProcessedAppleNotificationJpaRepository
        extends JpaRepository<ProcessedAppleNotification, UUID> {

    boolean existsByNotificationUuid(String notificationUuid);
}
