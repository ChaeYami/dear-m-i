package com.dearmi.backend.application.medication.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record TodayMedicationResult(List<ScheduleWithLogs> schedules) {

    public record ScheduleWithLogs(
            UUID scheduleId,
            String drugName,
            String dosage,
            Short timesPerDay,
            LocalDate startDate,
            LocalDate endDate,
            List<SlotLog> slots
    ) {}

    /** 시간대별 오늘의 복약 상태 */
    public record SlotLog(
            String timeSlot,          // MORNING, AFTERNOON, EVENING, BEDTIME
            LocalTime notifyTime,     // 해당 시간대 알림 시각
            String status,            // TAKEN, SKIPPED, MISSED — null이면 아직 기록 없음
            UUID logId
    ) {}
}
