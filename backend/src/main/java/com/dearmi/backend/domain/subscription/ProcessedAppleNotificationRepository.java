package com.dearmi.backend.domain.subscription;

public interface ProcessedAppleNotificationRepository {

    boolean existsByNotificationUuid(String notificationUuid);

    ProcessedAppleNotification save(ProcessedAppleNotification notification);
}
