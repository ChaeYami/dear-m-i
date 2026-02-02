package com.dearmi.backend.presentation.prescription.dto;

import com.dearmi.backend.application.prescription.dto.MedicationResult;

import java.util.UUID;

public record MedicationResponse(
        UUID id,
        String drugName,
        String dosage,
        String directions,
        Short days
) {
    public static MedicationResponse from(MedicationResult result) {
        return new MedicationResponse(
                result.id(), result.drugName(), result.dosage(), result.directions(), result.days()
        );
    }
}
