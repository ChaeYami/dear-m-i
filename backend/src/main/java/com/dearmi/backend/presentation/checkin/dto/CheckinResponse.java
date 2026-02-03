package com.dearmi.backend.presentation.checkin.dto;

import com.dearmi.backend.application.checkin.dto.CheckinResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record CheckinResponse(
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
    public static CheckinResponse from(CheckinResult r) {
        return new CheckinResponse(
                r.id(), r.checkedAt(), r.emotionScore(), r.triggerTags(),
                r.memo(), r.sleepHours(), r.tookMedication(),
                r.createdAt(), r.updatedAt()
        );
    }
}
