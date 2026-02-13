package com.dearmi.backend.application.prescription.usecase;

import com.dearmi.backend.application.prescription.dto.MedicationDetailResult;

import java.util.UUID;

public interface GetMedicationDetailUseCase {
    MedicationDetailResult getDetail(UUID userId, UUID medicationId);
}
