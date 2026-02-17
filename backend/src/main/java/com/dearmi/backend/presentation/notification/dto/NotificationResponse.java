package com.dearmi.backend.presentation.notification.dto;

import com.dearmi.backend.application.notification.dto.NotificationResult;
import com.dearmi.backend.domain.notification.NotificationType;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

/**
 * 타임스탬프는 Instant(ISO-8601 with Z)로 내려보낸다.
 * DB 는 타임존 없는 timestamp 이고 @CreatedDate 가 JVM 기본 TZ(ECS=UTC)로 쓰므로,
 * 해당 zone 기준으로 Instant 변환해 오프셋을 명시 — 클라이언트가 local 로 잘못 파싱하는 버그 차단.
 */
public record NotificationResponse(
        UUID id,
        NotificationType type,
        String titleKey,
        List<String> titleParams,
        String bodyKey,
        List<String> bodyParams,
        UUID resourceId,
        String timeSlot,
        Instant readAt,
        Instant createdAt
) {
    private static Instant toInstant(LocalDateTime ldt) {
        return ldt == null ? null : ldt.atZone(ZoneId.systemDefault()).toInstant();
    }

    public static NotificationResponse from(NotificationResult r) {
        return new NotificationResponse(
                r.id(),
                r.type(),
                r.titleKey(),
                r.titleParams(),
                r.bodyKey(),
                r.bodyParams(),
                r.resourceId(),
                r.timeSlot(),
                toInstant(r.readAt()),
                toInstant(r.createdAt())
        );
    }
}
