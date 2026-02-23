package com.dearmi.backend.domain.medication;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MedicationSlotGroupRepository {

    MedicationSlotGroup save(MedicationSlotGroup group);

    Optional<MedicationSlotGroup> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    List<MedicationSlotGroup> findAllByUserIdAndDeletedAtIsNull(UUID userId);
}
