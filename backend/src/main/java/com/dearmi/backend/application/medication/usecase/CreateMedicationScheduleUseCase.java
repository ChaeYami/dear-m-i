package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.application.medication.dto.CreateMedicationScheduleCommand;
import com.dearmi.backend.application.medication.dto.MedicationScheduleResult;

public interface CreateMedicationScheduleUseCase {
    MedicationScheduleResult create(CreateMedicationScheduleCommand command);
}
