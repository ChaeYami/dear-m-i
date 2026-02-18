package com.dearmi.backend.application.sideeffect.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record UpdateSideEffectCommand(
        UUID userId,
        UUID logId,
        UUID medicationScheduleId,
        LocalDateTime occurredAt,
        String symptom,
        Short severity,
        String notes
) {}
