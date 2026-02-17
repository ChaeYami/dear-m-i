package com.dearmi.backend.application.notification.usecase;

import java.util.UUID;

public interface DeleteNotificationUseCase {
    /** 단일 알림 소프트 삭제. 본인 것이 아니거나 이미 삭제됐으면 CustomException(NOT_FOUND). */
    void delete(UUID userId, UUID notificationId);
}
