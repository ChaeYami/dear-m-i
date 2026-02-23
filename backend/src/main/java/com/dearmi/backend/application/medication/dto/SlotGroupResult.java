package com.dearmi.backend.application.medication.dto;

import com.dearmi.backend.domain.medication.MedicationSlotGroup;

import java.util.UUID;

public record SlotGroupResult(UUID id, String groupName) {
    public static SlotGroupResult from(MedicationSlotGroup g) {
        return new SlotGroupResult(g.getId(), g.getGroupName());
    }
}
