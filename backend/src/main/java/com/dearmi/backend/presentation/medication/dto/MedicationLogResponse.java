package com.dearmi.backend.presentation.medication.dto;

import com.dearmi.backend.application.medication.dto.MedicationLogResult;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record MedicationLogResponse(
        UUID logId,
        UUID scheduleId,
        LocalDate logDate,
        String timeSlot,
        String status,
        LocalDateTime takenAt
) {
    public static MedicationLogResponse from(MedicationLogResult r) {
        return new MedicationLogResponse(
                r.logId(), r.scheduleId(), r.logDate(),
                r.timeSlot(), r.status(), r.takenAt()
        );
    }
}
