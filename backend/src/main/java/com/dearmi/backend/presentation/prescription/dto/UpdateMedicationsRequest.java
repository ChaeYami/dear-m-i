package com.dearmi.backend.presentation.prescription.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record UpdateMedicationsRequest(@NotNull List<MedicationRequest> medications) {
    public record MedicationRequest(String drugName, String dosage, String singleDose, String directions, Short days) {}
}
