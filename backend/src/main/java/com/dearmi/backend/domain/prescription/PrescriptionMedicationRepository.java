package com.dearmi.backend.domain.prescription;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PrescriptionMedicationRepository {

    PrescriptionMedication save(PrescriptionMedication medication);

    Optional<PrescriptionMedication> findById(UUID id);

    List<PrescriptionMedication> findByPrescriptionId(UUID prescriptionId);

    void deleteByPrescriptionId(UUID prescriptionId);
}
