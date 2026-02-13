package com.dearmi.backend.presentation.medication.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record CreateMedicationScheduleRequest(
        UUID prescriptionMedicationId,          // nullable — 있으면 약품 정보 pre-fill
        String drugName,                        // prescriptionMedicationId 없을 때 필수
        String dosage,
        String singleDose,                      // nullable — 1회 투여량 (예: 1정, 0.5정)
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
