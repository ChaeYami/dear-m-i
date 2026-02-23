package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.medication.MedicationSlotGroup;
import com.dearmi.backend.domain.medication.MedicationSlotGroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class MedicationSlotGroupRepositoryImpl implements MedicationSlotGroupRepository {

    private final MedicationSlotGroupJpaRepository jpa;

    @Override
    public MedicationSlotGroup save(MedicationSlotGroup group) {
        return jpa.save(group);
    }

    @Override
    public Optional<MedicationSlotGroup> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId) {
        return jpa.findByIdAndUserIdAndDeletedAtIsNull(id, userId);
    }

    @Override
    public List<MedicationSlotGroup> findAllByUserIdAndDeletedAtIsNull(UUID userId) {
        return jpa.findAllByUserIdAndDeletedAtIsNull(userId);
    }
}
