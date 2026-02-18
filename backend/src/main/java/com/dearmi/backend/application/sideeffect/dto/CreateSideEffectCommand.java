package com.dearmi.backend.application.sideeffect.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record CreateSideEffectCommand(
        UUID userId,
        UUID medicationScheduleId, // nullable
        LocalDateTime occurredAt,
        String symptom,
        Short severity,            // nullable, 1~5
        String notes               // nullable
) {}
