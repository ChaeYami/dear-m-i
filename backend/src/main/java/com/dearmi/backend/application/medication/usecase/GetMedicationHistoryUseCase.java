package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.application.medication.dto.MedicationHistoryResult;

import java.time.LocalDate;
import java.util.UUID;

public interface GetMedicationHistoryUseCase {
    MedicationHistoryResult getHistory(UUID userId, LocalDate startDate, LocalDate endDate);
}
