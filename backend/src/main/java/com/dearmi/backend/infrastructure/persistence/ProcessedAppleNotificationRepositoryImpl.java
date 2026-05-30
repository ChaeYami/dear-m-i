package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.subscription.ProcessedAppleNotification;
import com.dearmi.backend.domain.subscription.ProcessedAppleNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ProcessedAppleNotificationRepositoryImpl implements ProcessedAppleNotificationRepository {

    private final ProcessedAppleNotificationJpaRepository jpa;

    @Override
    public boolean existsByNotificationUuid(String notificationUuid) {
        return jpa.existsByNotificationUuid(notificationUuid);
    }

    @Override
    public ProcessedAppleNotification save(ProcessedAppleNotification notification) {
        return jpa.save(notification);
    }
}
