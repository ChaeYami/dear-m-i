package com.dearmi.backend.application.prescription.usecase;

import java.util.UUID;

public interface RefreshMedicationDrugInfoUseCase {
    void refresh(UUID userId, UUID medicationId);
}
