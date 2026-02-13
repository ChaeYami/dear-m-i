package com.dearmi.backend.presentation.prescription.dto;

import com.dearmi.backend.application.prescription.dto.MedicationDetailResult;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.UUID;

public record MedicationDetailResponse(
        UUID id,
        @JsonProperty("medicationName") String drugName,
        String dosage,
        String singleDose,
        @JsonProperty("frequency") String directions,
        @JsonProperty("durationDays") Short days,
        String drugEffect,
        String drugCaution,
        String manufacturer,
        LocalDateTime drugInfoFetchedAt
) {
    public static MedicationDetailResponse from(MedicationDetailResult result) {
        return new MedicationDetailResponse(
                result.id(),
                result.drugName(),
                result.dosage(),
                result.singleDose(),
                result.directions(),
                result.days(),
                result.drugEffect(),
                result.drugCaution(),
                result.manufacturer(),
                result.drugInfoFetchedAt()
        );
    }
}
