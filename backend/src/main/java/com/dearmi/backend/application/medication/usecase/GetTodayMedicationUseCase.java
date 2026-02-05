package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.application.medication.dto.TodayMedicationResult;

import java.time.LocalDate;
import java.util.UUID;

public interface GetTodayMedicationUseCase {
    TodayMedicationResult getToday(UUID userId);
    TodayMedicationResult getForDate(UUID userId, LocalDate date);
}
