package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.prescription.Prescription;
import com.dearmi.backend.domain.prescription.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class PrescriptionRepositoryImpl implements PrescriptionRepository {

    private final PrescriptionJpaRepository jpa;

    @Override
    public Prescription save(Prescription prescription) {
        return jpa.save(prescription);
    }

    @Override
    public Optional<Prescription> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId) {
        return jpa.findByIdAndUserIdAndDeletedAtIsNull(id, userId);
    }

    @Override
    public List<Prescription> findByUserIdAndDeletedAtIsNullOrderByPrescribedAtDesc(UUID userId) {
        return jpa.findByUserIdAndDeletedAtIsNullOrderByPrescribedAtDesc(userId);
    }

    @Override
    public List<Prescription> findByOcrStatusAndDeletedAtIsNull(String ocrStatus) {
        return jpa.findByOcrStatusAndDeletedAtIsNull(ocrStatus);
    }

    @Override
    public void detachSchedule(UUID scheduleId) {
        jpa.detachSchedule(scheduleId);
    }
}
