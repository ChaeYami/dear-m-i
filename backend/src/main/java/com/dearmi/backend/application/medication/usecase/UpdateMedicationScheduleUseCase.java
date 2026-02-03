package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.application.medication.dto.MedicationScheduleResult;
import com.dearmi.backend.application.medication.dto.UpdateMedicationScheduleCommand;

public interface UpdateMedicationScheduleUseCase {
    MedicationScheduleResult update(UpdateMedicationScheduleCommand command);
}
