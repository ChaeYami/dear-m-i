package com.dearmi.backend.presentation.medication.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.time.LocalTime;

public record UpdateMedicationScheduleRequest(
        @NotBlank String drugName,
        String dosage,
        String drugCategory,                    // nullable — 약 종류 (항우울제, 수면진정제 등)
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
