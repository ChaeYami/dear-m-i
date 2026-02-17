package com.dearmi.backend.domain.notification;

import com.dearmi.backend.common.entity.BaseTimestampEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 발송된 알림 히스토리 레코드.
 * NotificationSetting 은 사용자 선호, 이 엔티티는 실제 발송된 알림의 기록이다.
 *
 * title/body 를 해석된 문자열이 아닌 i18n 메시지 키 + 파라미터 형태로 저장해,
 * 사용자가 나중에 앱 언어를 바꿔도 히스토리 화면에서 현재 언어로 렌더링된다.
 */
@Entity
@Table(name = "notifications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Notification extends BaseTimestampEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationType type;

    @Column(name = "title_key", nullable = false, length = 200)
    private String titleKey;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "title_params", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private List<String> titleParams = new ArrayList<>();

    @Column(name = "body_key", nullable = false, length = 200)
    private String bodyKey;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "body_params", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private List<String> bodyParams = new ArrayList<>();

    /** hospital_schedules 또는 medication_schedules 의 id. 리소스 삭제 시 null 로 세팅됨. */
    @Column(name = "resource_id", columnDefinition = "uuid")
    private UUID resourceId;

    /** MEDICATION 타입 전용: MORNING/AFTERNOON/EVENING/BEDTIME. 그 외에는 null. */
    @Column(name = "time_slot", length = 20)
    private String timeSlot;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public boolean isRead() {
        return readAt != null;
    }

    public void markRead() {
        if (this.readAt == null) {
            this.readAt = LocalDateTime.now();
        }
    }
}
