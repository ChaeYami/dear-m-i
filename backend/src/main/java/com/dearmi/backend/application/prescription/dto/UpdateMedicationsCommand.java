package com.dearmi.backend.application.prescription.dto;

import java.util.List;
import java.util.UUID;

public record UpdateMedicationsCommand(
        UUID userId,
        UUID prescriptionId,
        List<MedicationItem> medications
) {
    public record MedicationItem(String drugName, String dosage, String directions, Short days) {}
}
