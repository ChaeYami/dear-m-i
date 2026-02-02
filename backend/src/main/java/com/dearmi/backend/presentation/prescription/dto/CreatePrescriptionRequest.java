package com.dearmi.backend.presentation.prescription.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.UUID;

public record CreatePrescriptionRequest(
        @NotBlank String s3Key,
        UUID scheduleId,          // nullable
        LocalDate prescribedAt    // nullable
) {}
