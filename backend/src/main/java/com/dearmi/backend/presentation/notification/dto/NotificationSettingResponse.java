package com.dearmi.backend.presentation.notification.dto;

import com.dearmi.backend.application.notification.dto.NotificationSettingResult;

public record NotificationSettingResponse(
        boolean enabled,
        boolean dayBefore,
        boolean dayOf,
        boolean medEnabled
) {
    public static NotificationSettingResponse from(NotificationSettingResult result) {
        return new NotificationSettingResponse(
                result.enabled(),
                result.dayBefore(),
                result.dayOf(),
                result.medEnabled()
        );
    }
}
