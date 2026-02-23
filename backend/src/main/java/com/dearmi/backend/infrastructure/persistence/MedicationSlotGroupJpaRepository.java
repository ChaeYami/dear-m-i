package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.medication.MedicationSlotGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MedicationSlotGroupJpaRepository extends JpaRepository<MedicationSlotGroup, UUID> {

    Optional<MedicationSlotGroup> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    List<MedicationSlotGroup> findAllByUserIdAndDeletedAtIsNull(UUID userId);
}
