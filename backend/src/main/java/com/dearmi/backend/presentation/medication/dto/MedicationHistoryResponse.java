package com.dearmi.backend.presentation.medication.dto;

import com.dearmi.backend.application.medication.dto.MedicationHistoryResult;
import com.dearmi.backend.application.medication.dto.MedicationLogResult;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record MedicationHistoryResponse(
        LocalDate startDate,
        LocalDate endDate,
        List<LogDto> logs
) {
    public record LogDto(
            UUID logId,
            UUID scheduleId,
            LocalDate logDate,
            String timeSlot,
            String status,
            LocalDateTime takenAt
    ) {}

    public static MedicationHistoryResponse from(MedicationHistoryResult result) {
        List<LogDto> logs = result.logs().stream()
                .map(l -> new LogDto(
                        l.logId(), l.scheduleId(), l.logDate(),
                        l.timeSlot(), l.status(), l.takenAt()))
                .toList();
        return new MedicationHistoryResponse(result.startDate(), result.endDate(), logs);
    }
}
