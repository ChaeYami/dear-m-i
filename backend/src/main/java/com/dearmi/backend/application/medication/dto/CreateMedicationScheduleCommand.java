package com.dearmi.backend.application.medication.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record CreateMedicationScheduleCommand(
        UUID userId,
        UUID prescriptionMedicationId,   // nullable — 있으면 약품 정보 pre-fill
        String drugName,
        String dosage,
        Short timesPerDay,
        LocalDate startDate,
        LocalDate endDate,
        boolean morning,
        boolean afternoon,
        boolean evening,
        boolean bedtime,
        LocalTime morningTime,
        LocalTime afternoonTime,
        LocalTime eveningTime,
        LocalTime bedtimeTime
) {}
