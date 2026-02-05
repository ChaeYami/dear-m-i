package com.dearmi.backend.application.notification.usecase;

import com.dearmi.backend.application.notification.dto.NotificationSettingResult;

import java.util.UUID;

public interface UpdateNotificationSettingUseCase {
    NotificationSettingResult updateSetting(UUID userId, boolean enabled, boolean dayBefore, boolean dayOf, boolean medEnabled);
}
