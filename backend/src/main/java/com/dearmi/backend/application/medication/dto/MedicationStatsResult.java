package com.dearmi.backend.application.medication.dto;

import java.time.LocalDate;

public record MedicationStatsResult(
        LocalDate startDate,
        LocalDate endDate,
        long totalLogs,                 // 기록된 로그 수 (taken + skipped)
        long scheduledDoses,            // 기간 내 예정 복용 횟수 (오늘까지, 활성 일정의 슬롯×일수)
        long takenCount,
        long skippedCount,
        long missedCount,               // scheduledDoses - taken - skipped (미체크 = 미복용)
        double completionRate           // takenCount / scheduledDoses * 100 (0.0 if scheduledDoses == 0)
) {}
