package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.medication.MedicationSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MedicationScheduleJpaRepository extends JpaRepository<MedicationSchedule, UUID> {

    Optional<MedicationSchedule> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    List<MedicationSchedule> findByUserIdAndDeletedAtIsNull(UUID userId);
}
