package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.medication.MedicationLog;
import com.dearmi.backend.domain.medication.MedicationLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class MedicationLogRepositoryImpl implements MedicationLogRepository {

    private final MedicationLogJpaRepository jpa;

    @Override
    public MedicationLog save(MedicationLog log) {
        return jpa.save(log);
    }

    @Override
    public Optional<MedicationLog> findByMedicationScheduleIdAndLogDateAndTimeSlot(
            UUID medicationScheduleId, LocalDate logDate, String timeSlot) {
        return jpa.findByMedicationScheduleIdAndLogDateAndTimeSlot(medicationScheduleId, logDate, timeSlot);
    }

    @Override
    public List<MedicationLog> findByMedicationScheduleIdAndLogDate(UUID medicationScheduleId, LocalDate logDate) {
        return jpa.findByMedicationScheduleIdAndLogDate(medicationScheduleId, logDate);
    }

    @Override
    public List<MedicationLog> findByUserIdAndLogDateBetweenOrderByLogDateDesc(
            UUID userId, LocalDate startDate, LocalDate endDate) {
        return jpa.findByUserIdAndLogDateBetweenOrderByLogDateDesc(userId, startDate, endDate);
    }

    @Override
    public long countByUserIdAndLogDateBetweenAndStatus(
            UUID userId, LocalDate startDate, LocalDate endDate, String status) {
        return jpa.countByUserIdAndLogDateBetweenAndStatus(userId, startDate, endDate, status);
    }

    @Override
    public long countByUserIdAndLogDateBetween(UUID userId, LocalDate startDate, LocalDate endDate) {
        return jpa.countByUserIdAndLogDateBetween(userId, startDate, endDate);
    }

    @Override
    public void deleteByMedicationScheduleId(UUID medicationScheduleId) {
        jpa.deleteByMedicationScheduleId(medicationScheduleId);
    }

    @Override
    public List<MedicationLog> findByMedicationScheduleId(UUID medicationScheduleId) {
        return jpa.findByMedicationScheduleId(medicationScheduleId);
    }

    @Override
    public boolean existsByMedicationScheduleIdAndLogDateAndTimeSlot(
            UUID medicationScheduleId, LocalDate logDate, String timeSlot) {
        return jpa.existsByMedicationScheduleIdAndLogDateAndTimeSlot(medicationScheduleId, logDate, timeSlot);
    }

    @Override
    public void delete(MedicationLog log) {
        jpa.delete(log);
    }
}
