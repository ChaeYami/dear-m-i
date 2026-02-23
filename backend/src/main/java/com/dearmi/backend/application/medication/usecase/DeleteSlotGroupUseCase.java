package com.dearmi.backend.application.medication.usecase;

import java.util.UUID;

public interface DeleteSlotGroupUseCase {
    void delete(UUID userId, UUID groupId);
}
