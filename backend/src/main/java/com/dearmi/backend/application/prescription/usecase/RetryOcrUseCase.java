package com.dearmi.backend.application.prescription.usecase;

import java.util.UUID;

public interface RetryOcrUseCase {
    void retry(UUID userId, UUID prescriptionId);
}
