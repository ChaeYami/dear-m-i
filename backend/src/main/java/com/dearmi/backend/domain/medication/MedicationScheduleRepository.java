package com.dearmi.backend.domain.medication;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MedicationScheduleRepository {

    MedicationSchedule save(MedicationSchedule schedule);

    Optional<MedicationSchedule> findById(UUID id);

    Optional<MedicationSchedule> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    List<MedicationSchedule> findByUserIdAndDeletedAtIsNull(UUID userId);

    /** 처방전 자동 등록 idempotency 체크용 — 해당 처방전에 이미 연결된 (소프트삭제 안 된) 일정 목록 */
    List<MedicationSchedule> findByPrescriptionIdAndDeletedAtIsNull(UUID prescriptionId);

    /** 오늘 기준 활성화된 해당 유저의 복약 일정 조회 (startDate <= date <= endDate, null 허용) */
    List<MedicationSchedule> findActiveForDateAndUserId(LocalDate date, UUID userId);

    /** 해당 날짜에 활성화된 모든 복약 일정 조회 (배치용) */
    List<MedicationSchedule> findActiveForDate(LocalDate date);

    /**
     * 매분 알림용: 해당 날짜에 활성화 + 4 슬롯 중 하나라도 enabled 이고 시간이 정확히 minute 인 일정만.
     * NotificationScheduler 매분 풀스캔 → due-only 쿼리로 전환.
     */
    List<MedicationSchedule> findDueForMinute(LocalDate date, java.time.LocalTime minute);

    /** 특정 슬롯에서 해당 그룹에 속한 모든 활성 일정 */
    List<MedicationSchedule> findAllBySlotGroupId(UUID groupId, TimeSlot slot);
}
