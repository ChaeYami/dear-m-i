package com.dearmi.backend.domain.medication;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface MedicationLogRepository {

    MedicationLog save(MedicationLog log);

    List<MedicationLog> findByUserIdAndTakenAtAfterOrderByTakenAtDesc(UUID userId, LocalDateTime after);

    List<MedicationLog> findByMedicationScheduleId(UUID medicationScheduleId);

    /** 오늘 해당 일정 + 시간대 로그 존재 여부 (알림 중복 방지) */
    boolean existsByMedicationScheduleIdAndLogDateAndTimeSlot(UUID medicationScheduleId, LocalDate logDate, String timeSlot);
}
