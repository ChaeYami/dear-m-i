package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.medication.MedicationSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MedicationScheduleJpaRepository extends JpaRepository<MedicationSchedule, UUID> {

    Optional<MedicationSchedule> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    List<MedicationSchedule> findByUserIdAndDeletedAtIsNull(UUID userId);

    List<MedicationSchedule> findByPrescriptionIdAndDeletedAtIsNull(UUID prescriptionId);

    List<MedicationSchedule> findAllByMorningGroupIdAndDeletedAtIsNull(UUID morningGroupId);
    List<MedicationSchedule> findAllByAfternoonGroupIdAndDeletedAtIsNull(UUID afternoonGroupId);
    List<MedicationSchedule> findAllByEveningGroupIdAndDeletedAtIsNull(UUID eveningGroupId);
    List<MedicationSchedule> findAllByBedtimeGroupIdAndDeletedAtIsNull(UUID bedtimeGroupId);

    @Query("SELECT s FROM MedicationSchedule s WHERE s.deletedAt IS NULL " +
           "AND s.userId = :userId " +
           "AND (s.startDate IS NULL OR s.startDate <= :date) " +
           "AND (s.endDate IS NULL OR s.endDate >= :date)")
    List<MedicationSchedule> findActiveForDateAndUserId(
            @Param("date") LocalDate date,
            @Param("userId") UUID userId);

    @Query("SELECT s FROM MedicationSchedule s WHERE s.deletedAt IS NULL " +
           "AND (s.startDate IS NULL OR s.startDate <= :date) " +
           "AND (s.endDate IS NULL OR s.endDate >= :date)")
    List<MedicationSchedule> findActiveForDate(@Param("date") LocalDate date);

    @Query("SELECT s FROM MedicationSchedule s WHERE s.deletedAt IS NULL " +
           "AND (s.startDate IS NULL OR s.startDate <= :date) " +
           "AND (s.endDate IS NULL OR s.endDate >= :date) " +
           "AND ( " +
           "  (s.morning   = TRUE AND s.morningTime   = :minute) " +
           "  OR (s.afternoon = TRUE AND s.afternoonTime = :minute) " +
           "  OR (s.evening   = TRUE AND s.eveningTime   = :minute) " +
           "  OR (s.bedtime   = TRUE AND s.bedtimeTime   = :minute) " +
           ")")
    List<MedicationSchedule> findDueForMinute(
            @Param("date") LocalDate date,
            @Param("minute") java.time.LocalTime minute);
}
