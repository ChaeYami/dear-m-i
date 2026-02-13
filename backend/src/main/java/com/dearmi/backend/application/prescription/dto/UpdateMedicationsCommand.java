package com.dearmi.backend.application.prescription.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record UpdateMedicationsCommand(
        UUID userId,
        UUID prescriptionId,
        String hospitalName,
        LocalDate prescribedAt,
        List<MedicationItem> medications
) {
    public record MedicationItem(String drugName, String dosage, String singleDose, String directions, Short days) {}
}
