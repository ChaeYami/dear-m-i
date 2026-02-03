package com.dearmi.backend.application.notification.usecase;

import com.dearmi.backend.application.notification.dto.NotificationSettingResult;

import java.util.UUID;

public interface GetNotificationSettingUseCase {
    NotificationSettingResult getSetting(UUID userId);
}
