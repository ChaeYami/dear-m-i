package com.dearmi.backend.application.medication.dto;

import java.time.LocalDate;

public record MedicationStatsResult(
        LocalDate startDate,
        LocalDate endDate,
        long totalLogs,
        long takenCount,
        long skippedCount,
        double completionRate           // takenCount / totalLogs * 100 (0.0 if totalLogs == 0)
) {}
