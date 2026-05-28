package com.dearmi.backend.presentation.medication.dto;

import com.dearmi.backend.application.medication.dto.MedicationStatsResult;

import java.time.LocalDate;

public record MedicationStatsResponse(
        LocalDate startDate,
        LocalDate endDate,
        long totalLogs,
        long scheduledDoses,
        long takenCount,
        long skippedCount,
        long missedCount,
        double completionRate
) {
    public static MedicationStatsResponse from(MedicationStatsResult result) {
        return new MedicationStatsResponse(
                result.startDate(), result.endDate(),
                result.totalLogs(), result.scheduledDoses(),
                result.takenCount(), result.skippedCount(),
                result.missedCount(), result.completionRate()
        );
    }
}
