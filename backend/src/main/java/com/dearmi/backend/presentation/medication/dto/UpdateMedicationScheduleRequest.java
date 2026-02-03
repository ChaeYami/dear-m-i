package com.dearmi.backend.presentation.medication.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.time.LocalTime;

public record UpdateMedicationScheduleRequest(
        @NotBlank String drugName,
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
