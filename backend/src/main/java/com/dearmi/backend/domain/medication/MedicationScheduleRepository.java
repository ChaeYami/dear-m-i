package com.dearmi.backend.domain.medication;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MedicationScheduleRepository {

    MedicationSchedule save(MedicationSchedule schedule);

    Optional<MedicationSchedule> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    List<MedicationSchedule> findByUserIdAndDeletedAtIsNull(UUID userId);

    /** 해당 날짜에 활성화된 모든 복약 일정 조회 (배치용) */
    List<MedicationSchedule> findActiveForDate(LocalDate date);
}
