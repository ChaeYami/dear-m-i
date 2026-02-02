package com.dearmi.backend.domain.notification;

import com.dearmi.backend.common.entity.BaseTimestampEntity;
import jakarta.persistence.*;
import lombok.*;

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

    public void update(Boolean enabled, Boolean dayBefore, Boolean dayOf) {
        this.enabled = enabled;
        this.dayBefore = dayBefore;
        this.dayOf = dayOf;
    }
}
