package com.dearmi.backend.application.prescription.usecase;

import java.util.UUID;

public interface SyncMedicationSchedulesUseCase {
    /** 해당 처방전의 약품 목록을 복약 일정에 일괄 등록. 동일 약품명이 이미 있으면 스킵. */
    SyncResult sync(UUID userId, UUID prescriptionId);

    record SyncResult(int createdCount, int totalMedications) {}
}
