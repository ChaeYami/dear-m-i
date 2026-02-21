package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.prescription.PrescriptionMedication;
import com.dearmi.backend.domain.prescription.PrescriptionMedicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class PrescriptionMedicationRepositoryImpl implements PrescriptionMedicationRepository {

    private final PrescriptionMedicationJpaRepository jpa;

    @Override
    public PrescriptionMedication save(PrescriptionMedication medication) {
        return jpa.save(medication);
    }

    @Override
    public Optional<PrescriptionMedication> findById(UUID id) {
        return jpa.findById(id);
    }

    @Override
    public List<PrescriptionMedication> findByPrescriptionId(UUID prescriptionId) {
        return jpa.findByPrescriptionId(prescriptionId);
    }

    @Override
    public List<PrescriptionMedication> findByPrescriptionIdIn(List<UUID> prescriptionIds) {
        return jpa.findByPrescriptionIdIn(prescriptionIds);
    }

    @Override
    public void deleteByPrescriptionId(UUID prescriptionId) {
        jpa.deleteByPrescriptionId(prescriptionId);
    }

    @Override
    public Optional<PrescriptionMedication> findCachedByDrugName(String drugName, LocalDateTime threshold) {
        return jpa.findCachedByDrugName(drugName, threshold);
    }
}
