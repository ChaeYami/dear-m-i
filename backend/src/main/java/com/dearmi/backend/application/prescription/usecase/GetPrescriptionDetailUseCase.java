package com.dearmi.backend.application.prescription.usecase;

import com.dearmi.backend.application.prescription.dto.PrescriptionResult;

import java.util.UUID;

public interface GetPrescriptionDetailUseCase {
    PrescriptionResult getDetail(UUID userId, UUID prescriptionId);
}
