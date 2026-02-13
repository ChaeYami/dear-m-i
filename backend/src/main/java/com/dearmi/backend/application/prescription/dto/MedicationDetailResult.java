package com.dearmi.backend.application.prescription.dto;

import com.dearmi.backend.domain.prescription.PrescriptionMedication;

import java.time.LocalDateTime;
import java.util.UUID;

public record MedicationDetailResult(
        UUID id,
        String drugName,
        String dosage,
        String singleDose,
        String directions,
        Short days,
        String drugEffect,
        String drugCaution,
        String manufacturer,
        LocalDateTime drugInfoFetchedAt
) {
    public static MedicationDetailResult from(PrescriptionMedication m) {
        return new MedicationDetailResult(
                m.getId(),
                m.getDrugName(),
                m.getDosage(),
                m.getSingleDose(),
                m.getDirections(),
                m.getDays(),
                m.getDrugEffect(),
                m.getDrugCaution(),
                m.getManufacturer(),
                m.getDrugInfoFetchedAt()
        );
    }
}
