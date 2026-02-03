package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.application.medication.dto.MedicationDetailResult;

import java.util.UUID;

public interface GetMedicationDetailUseCase {
    MedicationDetailResult getDetail(UUID userId, UUID medicationId);
}
