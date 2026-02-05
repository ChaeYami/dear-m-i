package com.dearmi.backend.application.notification.dto;

import com.dearmi.backend.domain.notification.NotificationSetting;

public record NotificationSettingResult(
        boolean enabled,
        boolean dayBefore,
        boolean dayOf,
        boolean medEnabled
) {
    public static NotificationSettingResult from(NotificationSetting setting) {
        return new NotificationSettingResult(
                Boolean.TRUE.equals(setting.getEnabled()),
                Boolean.TRUE.equals(setting.getDayBefore()),
                Boolean.TRUE.equals(setting.getDayOf()),
                Boolean.TRUE.equals(setting.getMedEnabled())
        );
    }
}
