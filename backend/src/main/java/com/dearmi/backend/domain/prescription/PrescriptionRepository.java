package com.dearmi.backend.domain.prescription;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PrescriptionRepository {

    Prescription save(Prescription prescription);

    Optional<Prescription> findById(UUID id);

    Optional<Prescription> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    List<Prescription> findByUserIdAndDeletedAtIsNullOrderByPrescribedAtDesc(UUID userId);

    List<Prescription> findByOcrStatusAndDeletedAtIsNull(String ocrStatus);

    /** 처방전 목록 페이징 (최신순) */
    List<Prescription> findPageByUserId(UUID userId, int offset, int size);

    long countByUserId(UUID userId);

    /** hospital_schedules 소프트 딜리트 시 연결 해제 (⑤ 원칙) */
    void detachSchedule(UUID scheduleId);
}
