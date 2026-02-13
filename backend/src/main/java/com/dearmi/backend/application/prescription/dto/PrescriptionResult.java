package com.dearmi.backend.application.prescription.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record PrescriptionResult(
        UUID id,
        UUID scheduleId,
        String s3Key,
        String ocrStatus,
        String hospitalName,
        LocalDate prescribedAt,
        List<MedicationResult> medications,
        String imageUrl          // GET Presigned URL (15분 유효)
) {}
