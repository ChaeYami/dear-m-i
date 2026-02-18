package com.dearmi.backend.application.sideeffect.dto;

import com.dearmi.backend.domain.sideeffect.SideEffectLog;

import java.time.LocalDateTime;
import java.util.UUID;

public record SideEffectLogResult(
        UUID id,
        UUID medicationScheduleId,
        LocalDateTime occurredAt,
        String symptom,
        Short severity,
        String notes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static SideEffectLogResult from(SideEffectLog s) {
        return new SideEffectLogResult(
                s.getId(),
                s.getMedicationScheduleId(),
                s.getOccurredAt(),
                s.getSymptom(),
                s.getSeverity(),
                s.getNotes(),
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }
}
