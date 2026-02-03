package com.dearmi.backend.application.medication.dto;

import java.time.LocalDate;
import java.util.List;

public record MedicationHistoryResult(
        LocalDate startDate,
        LocalDate endDate,
        List<MedicationLogResult> logs
) {}
