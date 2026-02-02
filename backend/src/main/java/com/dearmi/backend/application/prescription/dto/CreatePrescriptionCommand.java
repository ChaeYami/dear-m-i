package com.dearmi.backend.application.prescription.dto;

import java.time.LocalDate;
import java.util.UUID;

public record CreatePrescriptionCommand(
        UUID userId,
        String s3Key,
        UUID scheduleId,      // nullable
        LocalDate prescribedAt
) {}
