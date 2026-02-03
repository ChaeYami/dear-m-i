package com.dearmi.backend.domain.notification;

import com.dearmi.backend.common.entity.BaseTimestampEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "notification_settings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class NotificationSetting extends BaseTimestampEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true, columnDefinition = "uuid")
    private UUID userId;

    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    @Column(name = "day_before", nullable = false)
    @Builder.Default
    private Boolean dayBefore = true;

    @Column(name = "day_of", nullable = false)
    @Builder.Default
    private Boolean dayOf = true;

    @Column(name = "checkin_enabled", nullable = false)
    @Builder.Default
    private Boolean checkinEnabled = true;

    @Column(name = "checkin_time")
    @Builder.Default
    private LocalTime checkinTime = LocalTime.of(21, 0);

    @Column(name = "med_enabled", nullable = false)
    @Builder.Default
    private Boolean medEnabled = true;

    public void update(Boolean enabled, Boolean dayBefore, Boolean dayOf) {
        this.enabled = enabled;
        this.dayBefore = dayBefore;
        this.dayOf = dayOf;
    }

    public void updateCheckinSettings(Boolean checkinEnabled, LocalTime checkinTime) {
        this.checkinEnabled = checkinEnabled;
        this.checkinTime = checkinTime;
    }

    public void updateMedSettings(Boolean medEnabled) {
        this.medEnabled = medEnabled;
    }
}
