package com.dearmi.backend.application.search.dto;

import com.dearmi.backend.domain.checkin.DailyCheckin;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record CheckinSearchResult(
        UUID id,
        LocalDate checkedAt,
        Short emotionScore,
        List<String> triggerTags,
        String memo,
        BigDecimal sleepHours,
        Boolean tookMedication,
        LocalDateTime createdAt
) {
    public static CheckinSearchResult from(DailyCheckin checkin) {
        return new CheckinSearchResult(
                checkin.getId(),
                checkin.getCheckedAt(),
                checkin.getEmotionScore(),
                checkin.getTriggerTags(),
                checkin.getMemo(),
                checkin.getSleepHours(),
                checkin.getTookMedication(),
                checkin.getCreatedAt()
        );
    }
}
