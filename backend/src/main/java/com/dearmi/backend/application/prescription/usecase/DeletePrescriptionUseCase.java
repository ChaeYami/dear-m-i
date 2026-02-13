package com.dearmi.backend.application.prescription.usecase;

import java.util.UUID;

public interface DeletePrescriptionUseCase {
    void delete(UUID userId, UUID prescriptionId);
}
