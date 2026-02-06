package com.dearmi.backend.application.medication.dto;

import com.dearmi.backend.domain.medication.MedicationLog;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record MedicationLogResult(
        UUID logId,
        UUID scheduleId,
        String drugName,
        LocalDate logDate,
        String timeSlot,
        String status,
        LocalDateTime takenAt
) {
    public static MedicationLogResult from(MedicationLog log, String drugName) {
        return new MedicationLogResult(
                log.getId(),
                log.getMedicationScheduleId(),
                drugName,
                log.getLogDate(),
                log.getTimeSlot(),
                log.getStatus(),
                log.getTakenAt()
        );
    }
}
