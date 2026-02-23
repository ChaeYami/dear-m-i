package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.application.medication.dto.SlotGroupResult;
import com.dearmi.backend.domain.medication.MedicationSlotGroup;
import com.dearmi.backend.domain.medication.MedicationSlotGroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CreateSlotGroupUseCaseImpl implements CreateSlotGroupUseCase {

    private final MedicationSlotGroupRepository slotGroupRepository;

    @Override
    @Transactional
    public SlotGroupResult create(UUID userId, String groupName) {
        MedicationSlotGroup group = MedicationSlotGroup.builder()
                .userId(userId)
                .groupName(groupName.trim())
                .build();
        return SlotGroupResult.from(slotGroupRepository.save(group));
    }
}
