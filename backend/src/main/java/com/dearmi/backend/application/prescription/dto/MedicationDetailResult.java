package com.dearmi.backend.application.prescription.dto;

import com.dearmi.backend.domain.druginfo.DrugRegion;
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
        /** 약품 정보 출처 지역 — 앱 상세 링크/출처 라벨 분기용 (부모 처방전의 region) */
        DrugRegion region,
        LocalDateTime drugInfoFetchedAt
) {
    public static MedicationDetailResult from(PrescriptionMedication m, DrugRegion region) {
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
                region,
                m.getDrugInfoFetchedAt()
        );
    }
}
