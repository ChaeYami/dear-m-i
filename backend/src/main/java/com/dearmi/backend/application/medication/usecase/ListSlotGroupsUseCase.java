package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.application.medication.dto.SlotGroupResult;

import java.util.List;
import java.util.UUID;

public interface ListSlotGroupsUseCase {
    List<SlotGroupResult> list(UUID userId);
}
