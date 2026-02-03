package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.prescription.PrescriptionMedication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PrescriptionMedicationJpaRepository extends JpaRepository<PrescriptionMedication, UUID> {

    List<PrescriptionMedication> findByPrescriptionId(UUID prescriptionId);

    void deleteByPrescriptionId(UUID prescriptionId);

    /** drugName 일치 + drugInfoFetchedAt이 threshold 이후인 가장 최근 레코드 1건 (30일 캐시) */
    @Query("""
            SELECT m FROM PrescriptionMedication m
            WHERE m.drugName = :drugName
              AND m.drugInfoFetchedAt IS NOT NULL
              AND m.drugInfoFetchedAt > :threshold
            ORDER BY m.drugInfoFetchedAt DESC
            LIMIT 1
            """)
    Optional<PrescriptionMedication> findCachedByDrugName(
            @Param("drugName") String drugName,
            @Param("threshold") LocalDateTime threshold
    );
}
