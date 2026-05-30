package com.dearmi.backend.domain.subscription;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 이미 처리한 Apple Server-to-Server 알림 기록 (멱등성).
 * Apple 은 at-least-once 전달이라 같은 알림이 재전송될 수 있다.
 * notification_uuid 를 UNIQUE 로 두고, 처리 전 존재 여부를 확인해 중복 처리를 막는다.
 */
@Entity
@Table(name = "processed_apple_notifications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
@EntityListeners(AuditingEntityListener.class)
public class ProcessedAppleNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "notification_uuid", length = 100, nullable = false, unique = true)
    private String notificationUuid;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public static ProcessedAppleNotification of(String notificationUuid) {
        return ProcessedAppleNotification.builder()
                .notificationUuid(notificationUuid)
                .build();
    }
}
