package com.dearmi.backend.application.medication.dto;

import com.dearmi.backend.domain.medication.MedicationLogStatus;
import com.dearmi.backend.domain.medication.TimeSlot;

import java.time.LocalDate;
import java.util.UUID;

public record CheckMedicationCommand(
        UUID userId,
        UUID scheduleId,
        LocalDate logDate,
        TimeSlot timeSlot,
        MedicationLogStatus status      // TAKEN or SKIPPED
) {}
