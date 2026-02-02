package com.dearmi.backend.domain.prescription;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PrescriptionRepository {

    Prescription save(Prescription prescription);

    Optional<Prescription> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    List<Prescription> findByUserIdAndDeletedAtIsNullOrderByPrescribedAtDesc(UUID userId);

    List<Prescription> findByOcrStatusAndDeletedAtIsNull(String ocrStatus);

    /** hospital_schedules 소프트 딜리트 시 연결 해제 (⑤ 원칙) */
    void detachSchedule(UUID scheduleId);
}
