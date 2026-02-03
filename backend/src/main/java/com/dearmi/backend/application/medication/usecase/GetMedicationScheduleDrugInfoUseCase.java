package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.application.medication.dto.MedicationDrugInfoResult;

import java.util.UUID;

public interface GetMedicationScheduleDrugInfoUseCase {
    MedicationDrugInfoResult getDrugInfo(UUID userId, UUID scheduleId);
}
