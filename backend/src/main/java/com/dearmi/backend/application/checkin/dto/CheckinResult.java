package com.dearmi.backend.application.checkin.dto;

import com.dearmi.backend.domain.checkin.DailyCheckin;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record CheckinResult(
        UUID id,
        LocalDate checkedAt,
        Short emotionScore,
        List<String> triggerTags,
        String memo,
        BigDecimal sleepHours,
        Boolean tookMedication,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static CheckinResult from(DailyCheckin c) {
        return new CheckinResult(
                c.getId(),
                c.getCheckedAt(),
                c.getEmotionScore(),
                c.getTriggerTags(),
                c.getMemo(),
                c.getSleepHours(),
                c.getTookMedication(),
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }
}
