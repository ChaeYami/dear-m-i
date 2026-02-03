package com.dearmi.backend.domain.notification;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationSettingRepository {

    NotificationSetting save(NotificationSetting setting);

    Optional<NotificationSetting> findByUserId(UUID userId);

    /** D-1 / D-0 알림 발송 대상 조회 (배치용) */
    List<NotificationSetting> findEnabledSettings();

    /** 체크인 알림 활성화 + 지정 시각인 사용자 조회 (배치용) */
    List<NotificationSetting> findCheckinEnabledByCheckinTime(LocalTime time);
}
