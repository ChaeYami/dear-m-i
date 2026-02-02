package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.notification.NotificationSetting;
import com.dearmi.backend.domain.notification.NotificationSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class NotificationSettingRepositoryImpl implements NotificationSettingRepository {

    private final NotificationSettingJpaRepository jpa;

    @Override
    public NotificationSetting save(NotificationSetting setting) {
        return jpa.save(setting);
    }

    @Override
    public Optional<NotificationSetting> findByUserId(UUID userId) {
        return jpa.findByUserId(userId);
    }

    @Override
    public List<NotificationSetting> findEnabledSettings() {
        return jpa.findEnabledSettings();
    }
}
