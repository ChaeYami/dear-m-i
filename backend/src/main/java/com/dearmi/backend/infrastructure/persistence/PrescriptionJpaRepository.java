package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.prescription.Prescription;
import org.springframework.data.domain.Pageable;
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

    /** 처방일(prescribedAt) 기준 최신순. NULL(OCR 파싱 실패 등) 은 뒤로. */
    @Query("SELECT p FROM Prescription p WHERE p.userId = :userId AND p.deletedAt IS NULL " +
           "ORDER BY p.prescribedAt DESC NULLS LAST, p.createdAt DESC")
    List<Prescription> findPageByUserId(@Param("userId") UUID userId, Pageable pageable);

    long countByUserIdAndDeletedAtIsNull(UUID userId);

    long countByUserIdAndDeletedAtIsNullAndCreatedAtAfter(UUID userId, java.time.LocalDateTime after);

    /** hospital_schedules 소프트 딜리트 시 schedule_id NULL 처리 (⑤ 원칙) */
    @Modifying
    @Query("UPDATE Prescription p SET p.scheduleId = NULL WHERE p.scheduleId = :scheduleId")
    void detachSchedule(@Param("scheduleId") UUID scheduleId);
}
