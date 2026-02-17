package com.dearmi.backend.application.notification.usecase;

import java.util.UUID;

public interface MarkNotificationReadUseCase {
    /** 단일 알림 읽음 처리. 본인 것이 아니거나 없으면 CustomException(NOT_FOUND) 던짐. */
    void markRead(UUID userId, UUID notificationId);
}
