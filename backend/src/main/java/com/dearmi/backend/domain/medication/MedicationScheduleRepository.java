package com.dearmi.backend.domain.medication;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MedicationScheduleRepository {

    MedicationSchedule save(MedicationSchedule schedule);

    Optional<MedicationSchedule> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    List<MedicationSchedule> findByUserIdAndDeletedAtIsNull(UUID userId);
}
