package com.dearmi.backend.presentation.schedule.dto;

import com.dearmi.backend.application.schedule.dto.ScheduleResult;

import java.time.LocalDateTime;
import java.util.UUID;

public record ScheduleResponse(
        UUID id,
        String hospitalName,
        LocalDateTime scheduledAt,
        String memo,
        String status,
        boolean hasCounselingRecord
) {
    public static ScheduleResponse from(ScheduleResult result) {
        return new ScheduleResponse(
                result.id(),
                result.hospitalName(),
                result.scheduledAt(),
                result.memo(),
                result.status(),
                result.hasCounselingRecord()
        );
    }
}
