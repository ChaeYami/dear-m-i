package com.dearmi.backend.presentation.medication.dto;

import com.dearmi.backend.domain.medication.MedicationLogStatus;
import com.dearmi.backend.domain.medication.TimeSlot;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CheckMedicationRequest(
        @NotNull LocalDate logDate,
        @NotNull TimeSlot timeSlot,
        @NotNull MedicationLogStatus status     // TAKEN or SKIPPED
) {}
