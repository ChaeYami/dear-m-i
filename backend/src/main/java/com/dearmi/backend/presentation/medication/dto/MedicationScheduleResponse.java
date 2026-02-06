package com.dearmi.backend.presentation.medication.dto;

import com.dearmi.backend.application.medication.dto.MedicationScheduleResult;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record MedicationScheduleResponse(
        UUID id,
        UUID prescriptionMedicationId,
        String drugName,
        String dosage,
        String drugCategory,
        String drugCaution,
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
) {
    public static MedicationScheduleResponse from(MedicationScheduleResult r) {
        return new MedicationScheduleResponse(
                r.id(), r.prescriptionMedicationId(),
                r.drugName(), r.dosage(), r.drugCategory(), r.drugCaution(),
                r.timesPerDay(),
                r.startDate(), r.endDate(),
                r.morning(), r.afternoon(), r.evening(), r.bedtime(),
                r.morningTime(), r.afternoonTime(), r.eveningTime(), r.bedtimeTime()
        );
    }
}
