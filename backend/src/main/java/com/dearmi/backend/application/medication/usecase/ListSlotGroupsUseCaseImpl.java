package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.application.medication.dto.SlotGroupResult;
import com.dearmi.backend.domain.medication.MedicationSlotGroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ListSlotGroupsUseCaseImpl implements ListSlotGroupsUseCase {

    private final MedicationSlotGroupRepository slotGroupRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SlotGroupResult> list(UUID userId) {
        return slotGroupRepository.findAllByUserIdAndDeletedAtIsNull(userId)
                .stream()
                .map(SlotGroupResult::from)
                .toList();
    }
}
