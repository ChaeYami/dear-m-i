package com.dearmi.backend.presentation.medication.dto;

import com.dearmi.backend.application.medication.dto.MedicationDrugInfoResult;
import com.dearmi.backend.domain.druginfo.DrugRegion;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class MedicationDrugInfoResponse {
    private final UUID scheduleId;
    private final String drugName;
    private final String dosage;
    private final String drugEffect;
    private final String drugUsage;
    private final String drugCaution;
    private final String manufacturer;
    private final String itemSeq;
    private final DrugRegion region;
    private final boolean drugInfoPending;

    public static MedicationDrugInfoResponse from(MedicationDrugInfoResult result) {
        return MedicationDrugInfoResponse.builder()
                .scheduleId(result.getScheduleId())
                .drugName(result.getDrugName())
                .dosage(result.getDosage())
                .drugEffect(result.getDrugEffect())
                .drugUsage(result.getDrugUsage())
                .drugCaution(result.getDrugCaution())
                .itemSeq(result.getItemSeq())
                .manufacturer(result.getManufacturer())
                .region(result.getRegion())
                .drugInfoPending(result.isDrugInfoPending())
                .build();
    }
}
