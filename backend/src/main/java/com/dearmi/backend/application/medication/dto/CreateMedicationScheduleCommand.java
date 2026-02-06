package com.dearmi.backend.application.medication.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record CreateMedicationScheduleCommand(
        UUID userId,
        UUID prescriptionMedicationId,   // nullable — 있으면 약품 정보 pre-fill
        String drugName,
        String dosage,
        String drugCategory,             // nullable — 약 종류 (항우울제, 수면진정제 등)
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
