package com.dearmi.backend.presentation.medication.dto;

import com.dearmi.backend.application.medication.dto.MedicationStatsResult;

import java.time.LocalDate;

public record MedicationStatsResponse(
        LocalDate startDate,
        LocalDate endDate,
        long totalLogs,
        long takenCount,
        long skippedCount,
        double completionRate
) {
    public static MedicationStatsResponse from(MedicationStatsResult result) {
        return new MedicationStatsResponse(
                result.startDate(), result.endDate(),
                result.totalLogs(), result.takenCount(),
                result.skippedCount(), result.completionRate()
        );
    }
}
