package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.domain.medication.MedicationLogStatus;
import com.dearmi.backend.domain.medication.TimeSlot;

import java.time.LocalDate;
import java.util.UUID;

public interface BulkCheckGroupMedicationUseCase {
    /** 그룹 내 모든 약 일괄 체크 (알림 액션 버튼 연동) */
    void bulkCheck(UUID userId, UUID groupId, TimeSlot timeSlot, LocalDate logDate, MedicationLogStatus status);
}
