package com.dearmi.backend.presentation.prescription.dto;

import com.dearmi.backend.application.prescription.dto.MedicationResult;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.UUID;

public record MedicationResponse(
        UUID id,
        @JsonProperty("medicationName") String drugName,
        String dosage,
        String singleDose,
        @JsonProperty("frequency") String directions,
        @JsonProperty("durationDays") Short days
) {
    public static MedicationResponse from(MedicationResult result) {
        return new MedicationResponse(
                result.id(), result.drugName(), result.dosage(), result.singleDose(), result.directions(), result.days()
        );
    }
}
