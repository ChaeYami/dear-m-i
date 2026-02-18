package com.dearmi.backend.presentation.sideeffect.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.UUID;

public record UpdateSideEffectRequest(
        UUID medicationScheduleId,

        @NotNull
        LocalDateTime occurredAt,

        @NotBlank
        String symptom,

        @Min(1) @Max(5)
        Short severity,

        String notes
) {}
