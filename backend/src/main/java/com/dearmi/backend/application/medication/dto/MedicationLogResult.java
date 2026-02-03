package com.dearmi.backend.application.medication.dto;

import com.dearmi.backend.domain.medication.MedicationLog;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record MedicationLogResult(
        UUID logId,
        UUID scheduleId,
        LocalDate logDate,
        String timeSlot,
        String status,
        LocalDateTime takenAt
) {
    public static MedicationLogResult from(MedicationLog log) {
        return new MedicationLogResult(
                log.getId(),
                log.getMedicationScheduleId(),
                log.getLogDate(),
                log.getTimeSlot(),
                log.getStatus(),
                log.getTakenAt()
        );
    }
}
