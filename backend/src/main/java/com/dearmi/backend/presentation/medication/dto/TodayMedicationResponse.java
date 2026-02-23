package com.dearmi.backend.presentation.medication.dto;

import com.dearmi.backend.application.medication.dto.TodayMedicationResult;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record TodayMedicationResponse(List<ScheduleDto> schedules) {

    public record ScheduleDto(
            UUID scheduleId,
            String drugName,
            String dosage,
            Short timesPerDay,
            LocalDate startDate,
            LocalDate endDate,
            List<SlotDto> slots
    ) {}

    public record SlotDto(
            String timeSlot,
            LocalTime notifyTime,
            String status,
            UUID logId,
            UUID groupId,
            String groupName
    ) {}

    public static TodayMedicationResponse from(TodayMedicationResult result) {
        List<ScheduleDto> schedules = result.schedules().stream()
                .map(s -> new ScheduleDto(
                        s.scheduleId(), s.drugName(), s.dosage(),
                        s.timesPerDay(), s.startDate(), s.endDate(),
                        s.slots().stream()
                                .map(sl -> new SlotDto(
                                        sl.timeSlot(), sl.notifyTime(), sl.status(), sl.logId(),
                                        sl.groupId(), sl.groupName()))
                                .toList()
                ))
                .toList();
        return new TodayMedicationResponse(schedules);
    }
}
