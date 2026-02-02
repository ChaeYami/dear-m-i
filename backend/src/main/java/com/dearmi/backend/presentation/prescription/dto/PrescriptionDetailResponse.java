package com.dearmi.backend.presentation.prescription.dto;

import com.dearmi.backend.application.prescription.dto.PrescriptionResult;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record PrescriptionDetailResponse(
        UUID id,
        UUID scheduleId,
        String ocrStatus,
        LocalDate prescribedAt,
        List<MedicationResponse> medications,
        String imageUrl
) {
    public static PrescriptionDetailResponse from(PrescriptionResult result) {
        return new PrescriptionDetailResponse(
                result.id(),
                result.scheduleId(),
                result.ocrStatus(),
                result.prescribedAt(),
                result.medications().stream().map(MedicationResponse::from).toList(),
                result.imageUrl()
        );
    }
}
