package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.medication.MedicationLogRepository;
import com.dearmi.backend.domain.medication.MedicationSchedule;
import com.dearmi.backend.domain.medication.MedicationScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DeleteMedicationScheduleUseCaseImpl implements DeleteMedicationScheduleUseCase {

    private final MedicationScheduleRepository medicationScheduleRepository;
    private final MedicationLogRepository medicationLogRepository;

    @Override
    @Transactional
    public void delete(UUID userId, UUID scheduleId) {
        // ④ 원칙: 소유권 검증 — 없거나 타인 소유면 404
        MedicationSchedule schedule = medicationScheduleRepository
                .findByIdAndUserIdAndDeletedAtIsNull(scheduleId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        // ⑤ 원칙: medication_logs CASCADE 삭제
        medicationLogRepository.deleteByMedicationScheduleId(scheduleId);

        // 소프트딜리트
        schedule.softDelete();
        medicationScheduleRepository.save(schedule);
    }
}
