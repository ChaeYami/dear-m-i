package com.dearmi.backend.application.search.dto;

import com.dearmi.backend.domain.checkin.DailyCheckin;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record CheckinSearchResult(
        UUID id,
        LocalDate checkedAt,
        Short emotionScore,
        String memo,
        LocalDateTime createdAt
) {
    public static CheckinSearchResult from(DailyCheckin checkin) {
        return new CheckinSearchResult(
                checkin.getId(),
                checkin.getCheckedAt(),
                checkin.getEmotionScore(),
                checkin.getMemo(),
                checkin.getCreatedAt()
        );
    }
}
