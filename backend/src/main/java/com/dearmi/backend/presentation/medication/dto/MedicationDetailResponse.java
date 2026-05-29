package com.dearmi.backend.presentation.medication.dto;

import com.dearmi.backend.application.medication.dto.MedicationDetailResult;
import com.dearmi.backend.domain.druginfo.DrugRegion;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record MedicationDetailResponse(
        UUID id,
        String drugName,
        String dosage,
        String directions,
        Short days,
        String drugEffect,
        String drugCaution,
        String manufacturer,
        DrugRegion region,
        boolean drugInfoPending,
        String drugInfoMessage       // drugInfoFetchedAt null이면 "약품 정보 조회 중"
) {
    public static MedicationDetailResponse from(MedicationDetailResult result) {
        boolean pending = (result.drugInfoFetchedAt() == null);
        return new MedicationDetailResponse(
                result.id(),
                result.drugName(),
                result.dosage(),
                result.directions(),
                result.days(),
                result.drugEffect(),
                result.drugCaution(),
                result.manufacturer(),
                result.region(),
                pending,
                pending ? "약품 정보 조회 중" : null
        );
    }
}
