package com.dearmi.backend.application.medication.dto;

import com.dearmi.backend.domain.medication.MedicationSchedule;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record MedicationScheduleResult(
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
    public static MedicationScheduleResult from(MedicationSchedule s) {
        return new MedicationScheduleResult(
                s.getId(),
                s.getPrescriptionMedicationId(),
                s.getDrugName(),
                s.getDosage(),
                s.getDrugCategory(),
                s.getDrugCaution(),
                s.getTimesPerDay(),
                s.getStartDate(),
                s.getEndDate(),
                Boolean.TRUE.equals(s.getMorning()),
                Boolean.TRUE.equals(s.getAfternoon()),
                Boolean.TRUE.equals(s.getEvening()),
                Boolean.TRUE.equals(s.getBedtime()),
                s.getMorningTime(),
                s.getAfternoonTime(),
                s.getEveningTime(),
                s.getBedtimeTime()
        );
    }
}
