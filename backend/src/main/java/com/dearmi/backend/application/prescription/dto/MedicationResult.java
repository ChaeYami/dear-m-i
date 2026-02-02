package com.dearmi.backend.application.prescription.dto;

import com.dearmi.backend.domain.prescription.PrescriptionMedication;

import java.util.UUID;

public record MedicationResult(
        UUID id,
        String drugName,
        String dosage,
        String directions,
        Short days
) {
    public static MedicationResult from(PrescriptionMedication m) {
        return new MedicationResult(m.getId(), m.getDrugName(), m.getDosage(), m.getDirections(), m.getDays());
    }
}
