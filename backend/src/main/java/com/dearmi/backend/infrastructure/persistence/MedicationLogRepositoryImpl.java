package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.medication.MedicationLog;
import com.dearmi.backend.domain.medication.MedicationLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
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
    public List<MedicationLog> findByUserIdAndTakenAtAfterOrderByTakenAtDesc(UUID userId, LocalDateTime after) {
        return jpa.findByUserIdAndTakenAtAfterOrderByTakenAtDesc(userId, after);
    }

    @Override
    public List<MedicationLog> findByMedicationScheduleId(UUID medicationScheduleId) {
        return jpa.findByMedicationScheduleId(medicationScheduleId);
    }

    @Override
    public boolean existsByMedicationScheduleIdAndLogDateAndTimeSlot(UUID medicationScheduleId, LocalDate logDate, String timeSlot) {
        return jpa.existsByMedicationScheduleIdAndLogDateAndTimeSlot(medicationScheduleId, logDate, timeSlot);
    }
}
