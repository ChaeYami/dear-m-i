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
public class GetNotificationSettingUseCaseImpl implements GetNotificationSettingUseCase {

    private final NotificationSettingRepository notificationSettingRepository;

    @Override
    @Transactional
    public NotificationSettingResult getSetting(UUID userId) {
        NotificationSetting setting = notificationSettingRepository.findByUserId(userId)
                .orElseGet(() -> notificationSettingRepository.save(
                        NotificationSetting.builder()
                                .userId(userId)
                                .build()
                ));
        return NotificationSettingResult.from(setting);
    }
}
