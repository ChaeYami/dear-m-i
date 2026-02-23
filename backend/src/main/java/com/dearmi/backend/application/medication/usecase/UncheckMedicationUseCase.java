package com.dearmi.backend.application.medication.usecase;

import java.time.LocalDate;
import java.util.UUID;

public interface UncheckMedicationUseCase {
    void uncheck(UUID userId, UUID scheduleId, LocalDate logDate, String timeSlot);
}
