package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.application.medication.dto.CheckMedicationCommand;
import com.dearmi.backend.application.medication.dto.MedicationLogResult;

public interface CheckMedicationUseCase {
    MedicationLogResult check(CheckMedicationCommand command);
}
