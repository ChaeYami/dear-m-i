package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.application.medication.dto.MedicationScheduleResult;

import java.util.List;
import java.util.UUID;

public interface ListMedicationSchedulesUseCase {
    /** 사용자의 모든 (삭제되지 않은) 복약 일정 — 캘린더 마킹 등에서 사용 */
    List<MedicationScheduleResult> listAll(UUID userId);
}
