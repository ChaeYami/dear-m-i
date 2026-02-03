package com.dearmi.backend.application.medication.dto;

import com.dearmi.backend.domain.medication.MedicationSchedule;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class MedicationDrugInfoResult {
    private final UUID scheduleId;
    private final String drugName;
    private final String dosage;
    private final String drugEffect;
    private final String drugUsage;
    private final String drugCaution;
    private final String manufacturer;
    private final String itemSeq;
    private final boolean drugInfoPending;

    public static MedicationDrugInfoResult from(MedicationSchedule s) {
        return MedicationDrugInfoResult.builder()
                .scheduleId(s.getId())
                .drugName(s.getDrugName())
                .dosage(s.getDosage())
                .drugEffect(s.getDrugEffect())
                .drugUsage(s.getDrugUsage())
                .drugCaution(s.getDrugCaution())
                .itemSeq(s.getItemSeq())
                .manufacturer(s.getManufacturer())
                .drugInfoPending(s.getDrugInfoFetchedAt() == null)
                .build();
    }
}
