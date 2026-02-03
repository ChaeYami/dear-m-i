package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.application.medication.dto.MedicationStatsResult;

import java.time.LocalDate;
import java.util.UUID;

public interface GetMedicationStatsUseCase {
    MedicationStatsResult getStats(UUID userId, LocalDate startDate, LocalDate endDate);
}
