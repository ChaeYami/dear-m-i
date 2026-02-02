package com.dearmi.backend.application.prescription.usecase;

import com.dearmi.backend.application.prescription.dto.CreatePrescriptionCommand;

import java.util.UUID;

public interface CreatePrescriptionUseCase {
    UUID create(CreatePrescriptionCommand command);
}
