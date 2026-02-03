package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.medication.MedicationLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface MedicationLogJpaRepository extends JpaRepository<MedicationLog, UUID> {

    List<MedicationLog> findByUserIdAndTakenAtAfterOrderByTakenAtDesc(UUID userId, LocalDateTime after);

    List<MedicationLog> findByMedicationScheduleId(UUID medicationScheduleId);

    boolean existsByMedicationScheduleIdAndLogDateAndTimeSlot(UUID medicationScheduleId, LocalDate logDate, String timeSlot);
}
