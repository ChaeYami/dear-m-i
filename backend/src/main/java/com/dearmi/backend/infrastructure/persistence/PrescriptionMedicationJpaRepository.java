package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.prescription.PrescriptionMedication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PrescriptionMedicationJpaRepository extends JpaRepository<PrescriptionMedication, UUID> {

    List<PrescriptionMedication> findByPrescriptionId(UUID prescriptionId);

    void deleteByPrescriptionId(UUID prescriptionId);
}
