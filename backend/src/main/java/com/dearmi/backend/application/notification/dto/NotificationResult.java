package com.dearmi.backend.application.notification.dto;

import com.dearmi.backend.domain.notification.Notification;
import com.dearmi.backend.domain.notification.NotificationType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record NotificationResult(
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
    public static NotificationResult from(Notification n) {
        return new NotificationResult(
                n.getId(),
                n.getType(),
                n.getTitleKey(),
                n.getTitleParams(),
                n.getBodyKey(),
                n.getBodyParams(),
                n.getResourceId(),
                n.getTimeSlot(),
                n.getReadAt(),
                n.getCreatedAt()
        );
    }
}
