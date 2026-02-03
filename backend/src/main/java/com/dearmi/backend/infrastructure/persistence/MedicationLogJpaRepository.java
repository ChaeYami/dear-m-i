package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.medication.MedicationLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MedicationLogJpaRepository extends JpaRepository<MedicationLog, UUID> {

    Optional<MedicationLog> findByMedicationScheduleIdAndLogDateAndTimeSlot(
            UUID medicationScheduleId, LocalDate logDate, String timeSlot);

    List<MedicationLog> findByMedicationScheduleIdAndLogDate(UUID medicationScheduleId, LocalDate logDate);

    List<MedicationLog> findByUserIdAndLogDateBetweenOrderByLogDateDesc(
            UUID userId, LocalDate startDate, LocalDate endDate);

    long countByUserIdAndLogDateBetweenAndStatus(UUID userId, LocalDate startDate, LocalDate endDate, String status);

    long countByUserIdAndLogDateBetween(UUID userId, LocalDate startDate, LocalDate endDate);

    void deleteByMedicationScheduleId(UUID medicationScheduleId);

    List<MedicationLog> findByMedicationScheduleId(UUID medicationScheduleId);

    boolean existsByMedicationScheduleIdAndLogDateAndTimeSlot(
            UUID medicationScheduleId, LocalDate logDate, String timeSlot);
}
