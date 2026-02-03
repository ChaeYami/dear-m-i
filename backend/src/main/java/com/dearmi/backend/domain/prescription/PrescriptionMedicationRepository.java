package com.dearmi.backend.domain.prescription;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PrescriptionMedicationRepository {

    PrescriptionMedication save(PrescriptionMedication medication);

    Optional<PrescriptionMedication> findById(UUID id);

    List<PrescriptionMedication> findByPrescriptionId(UUID prescriptionId);

    void deleteByPrescriptionId(UUID prescriptionId);

    /**
     * drugName 일치 + drugInfoFetchedAt이 threshold 이후인 레코드 조회 (30일 캐시 체크)
     * 가장 최근에 조회된 레코드 1건 반환
     */
    Optional<PrescriptionMedication> findCachedByDrugName(String drugName, LocalDateTime threshold);
}
