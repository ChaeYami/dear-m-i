package com.dearmi.backend.domain.notification;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationSettingRepository {

    NotificationSetting save(NotificationSetting setting);

    Optional<NotificationSetting> findByUserId(UUID userId);

    /** D-1 / D-0 알림 발송 대상 조회 (배치용) */
    List<NotificationSetting> findEnabledSettings();
}
