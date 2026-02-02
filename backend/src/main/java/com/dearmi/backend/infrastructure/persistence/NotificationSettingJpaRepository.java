package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.notification.NotificationSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationSettingJpaRepository extends JpaRepository<NotificationSetting, UUID> {

    Optional<NotificationSetting> findByUserId(UUID userId);

    @Query("SELECT n FROM NotificationSetting n WHERE n.enabled = true")
    List<NotificationSetting> findEnabledSettings();
}
