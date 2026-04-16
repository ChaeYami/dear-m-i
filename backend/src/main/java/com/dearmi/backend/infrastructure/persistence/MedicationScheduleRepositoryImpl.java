package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.medication.MedicationSchedule;
import com.dearmi.backend.domain.medication.MedicationScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class MedicationScheduleRepositoryImpl implements MedicationScheduleRepository {

    private final MedicationScheduleJpaRepository jpa;

    @Override
    public MedicationSchedule save(MedicationSchedule schedule) {
        return jpa.save(schedule);
    }

    @Override
    public Optional<MedicationSchedule> findById(UUID id) {
        return jpa.findById(id);
    }

    @Override
    public Optional<MedicationSchedule> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId) {
        return jpa.findByIdAndUserIdAndDeletedAtIsNull(id, userId);
    }

    @Override
    public List<MedicationSchedule> findByUserIdAndDeletedAtIsNull(UUID userId) {
        return jpa.findByUserIdAndDeletedAtIsNull(userId);
    }

    @Override
    public List<MedicationSchedule> findByPrescriptionIdAndDeletedAtIsNull(UUID prescriptionId) {
        return jpa.findByPrescriptionIdAndDeletedAtIsNull(prescriptionId);
    }

    @Override
    public List<MedicationSchedule> findActiveForDateAndUserId(LocalDate date, UUID userId) {
        return jpa.findActiveForDateAndUserId(date, userId);
    }

    @Override
    public List<MedicationSchedule> findActiveForDate(LocalDate date) {
        return jpa.findActiveForDate(date);
    }

    @Override
    public List<MedicationSchedule> findDueForMinute(LocalDate date, java.time.LocalTime minute) {
        return jpa.findDueForMinute(date, minute);
    }

    @Override
    public List<MedicationSchedule> findAllBySlotGroupId(UUID groupId, com.dearmi.backend.domain.medication.TimeSlot slot) {
        return switch (slot) {
            case MORNING   -> jpa.findAllByMorningGroupIdAndDeletedAtIsNull(groupId);
            case AFTERNOON -> jpa.findAllByAfternoonGroupIdAndDeletedAtIsNull(groupId);
            case EVENING   -> jpa.findAllByEveningGroupIdAndDeletedAtIsNull(groupId);
            case BEDTIME   -> jpa.findAllByBedtimeGroupIdAndDeletedAtIsNull(groupId);
        };
    }
}
