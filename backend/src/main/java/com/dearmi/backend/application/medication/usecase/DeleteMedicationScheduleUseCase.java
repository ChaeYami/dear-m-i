package com.dearmi.backend.application.medication.usecase;

import java.util.UUID;

public interface DeleteMedicationScheduleUseCase {
    void delete(UUID userId, UUID scheduleId);
}
