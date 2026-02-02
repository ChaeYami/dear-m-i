package com.dearmi.backend.domain.medication;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface MedicationLogRepository {

    MedicationLog save(MedicationLog log);

    List<MedicationLog> findByUserIdAndTakenAtAfterOrderByTakenAtDesc(UUID userId, LocalDateTime after);

    List<MedicationLog> findByMedicationScheduleId(UUID medicationScheduleId);
}
