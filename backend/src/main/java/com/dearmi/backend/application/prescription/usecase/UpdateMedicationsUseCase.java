package com.dearmi.backend.application.prescription.usecase;

import com.dearmi.backend.application.prescription.dto.PrescriptionResult;
import com.dearmi.backend.application.prescription.dto.UpdateMedicationsCommand;

public interface UpdateMedicationsUseCase {
    PrescriptionResult update(UpdateMedicationsCommand command);
}
