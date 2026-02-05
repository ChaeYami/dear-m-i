package com.dearmi.backend.application.notification.usecase;

import com.dearmi.backend.application.notification.dto.NotificationSettingResult;
import com.dearmi.backend.domain.notification.NotificationSetting;
import com.dearmi.backend.domain.notification.NotificationSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UpdateNotificationSettingUseCaseImpl implements UpdateNotificationSettingUseCase {

    private final NotificationSettingRepository notificationSettingRepository;

    @Override
    @Transactional
    public NotificationSettingResult updateSetting(UUID userId, boolean enabled, boolean dayBefore, boolean dayOf, boolean medEnabled) {
        NotificationSetting setting = notificationSettingRepository.findByUserId(userId)
                .orElseGet(() -> notificationSettingRepository.save(
                        NotificationSetting.builder()
                                .userId(userId)
                                .build()
                ));
        setting.update(enabled, dayBefore, dayOf, medEnabled);
        return NotificationSettingResult.from(notificationSettingRepository.save(setting));
    }
}
