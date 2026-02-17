package com.dearmi.backend.application.notification.usecase;

import com.dearmi.backend.application.notification.dto.NotificationResult;
import com.dearmi.backend.application.record.dto.PageResult;

import java.util.UUID;

public interface GetNotificationsUseCase {
    PageResult<NotificationResult> getNotifications(UUID userId, int page, int size);
}
