package com.dearmi.backend.domain.medication;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MedicationLogRepository {

    MedicationLog save(MedicationLog log);

    /** UPSERT 기준 키: (scheduleId, logDate, timeSlot) */
    Optional<MedicationLog> findByMedicationScheduleIdAndLogDateAndTimeSlot(
            UUID medicationScheduleId, LocalDate logDate, String timeSlot);

    /** 오늘 일정별 모든 로그 조회 (오늘 현황 표시용) */
    List<MedicationLog> findByMedicationScheduleIdAndLogDate(UUID medicationScheduleId, LocalDate logDate);

    /** 기간별 복약 이력 조회 */
    List<MedicationLog> findByUserIdAndLogDateBetweenOrderByLogDateDesc(
            UUID userId, LocalDate startDate, LocalDate endDate);

    /** 기간별 TAKEN 개수 (완료율 계산용) */
    long countByUserIdAndLogDateBetweenAndStatus(UUID userId, LocalDate startDate, LocalDate endDate, String status);

    /** 기간별 전체 로그 개수 (완료율 분모) */
    long countByUserIdAndLogDateBetween(UUID userId, LocalDate startDate, LocalDate endDate);

    /** 복약 일정 삭제 시 연관 로그 CASCADE 삭제 (⑤ 원칙) */
    void deleteByMedicationScheduleId(UUID medicationScheduleId);

    List<MedicationLog> findByMedicationScheduleId(UUID medicationScheduleId);

    boolean existsByMedicationScheduleIdAndLogDateAndTimeSlot(UUID medicationScheduleId, LocalDate logDate, String timeSlot);
}
