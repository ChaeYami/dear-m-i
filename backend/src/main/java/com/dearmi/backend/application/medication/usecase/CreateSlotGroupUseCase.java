package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.application.medication.dto.SlotGroupResult;

import java.util.UUID;

public interface CreateSlotGroupUseCase {
    SlotGroupResult create(UUID userId, String groupName);
}
