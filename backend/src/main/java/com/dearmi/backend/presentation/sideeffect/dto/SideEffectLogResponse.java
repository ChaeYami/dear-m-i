package com.dearmi.backend.presentation.sideeffect.dto;

import com.dearmi.backend.application.sideeffect.dto.SideEffectLogResult;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

public record SideEffectLogResponse(
        UUID id,
        UUID medicationScheduleId,
        Instant occurredAt,
        String symptom,
        Short severity,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    private static Instant toInstant(LocalDateTime ldt) {
        return ldt == null ? null : ldt.atZone(ZoneId.systemDefault()).toInstant();
    }

    public static SideEffectLogResponse from(SideEffectLogResult r) {
        return new SideEffectLogResponse(
                r.id(),
                r.medicationScheduleId(),
                toInstant(r.occurredAt()),
                r.symptom(),
                r.severity(),
                r.notes(),
                toInstant(r.createdAt()),
                toInstant(r.updatedAt())
        );
    }
}
