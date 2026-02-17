package com.dearmi.backend.presentation.notification.dto;

import com.dearmi.backend.application.notification.dto.NotificationResult;
import com.dearmi.backend.domain.notification.NotificationType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        NotificationType type,
        String titleKey,
        List<String> titleParams,
        String bodyKey,
        List<String> bodyParams,
        UUID resourceId,
        String timeSlot,
        LocalDateTime readAt,
        LocalDateTime createdAt
) {
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
                r.readAt(),
                r.createdAt()
        );
    }
}
