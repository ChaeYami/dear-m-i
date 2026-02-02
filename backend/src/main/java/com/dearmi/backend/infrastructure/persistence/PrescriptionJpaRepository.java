package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.prescription.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PrescriptionJpaRepository extends JpaRepository<Prescription, UUID> {

    Optional<Prescription> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    List<Prescription> findByUserIdAndDeletedAtIsNullOrderByPrescribedAtDesc(UUID userId);

    List<Prescription> findByOcrStatusAndDeletedAtIsNull(String ocrStatus);

    /** hospital_schedules 소프트 딜리트 시 schedule_id NULL 처리 (⑤ 원칙) */
    @Modifying
    @Query("UPDATE Prescription p SET p.scheduleId = NULL WHERE p.scheduleId = :scheduleId")
    void detachSchedule(@Param("scheduleId") UUID scheduleId);
}
