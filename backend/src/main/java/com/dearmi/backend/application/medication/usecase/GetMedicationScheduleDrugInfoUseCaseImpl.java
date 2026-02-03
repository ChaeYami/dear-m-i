package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.application.medication.dto.MedicationDrugInfoResult;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.medication.MedicationScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetMedicationScheduleDrugInfoUseCaseImpl implements GetMedicationScheduleDrugInfoUseCase {

    private final MedicationScheduleRepository medicationScheduleRepository;

    @Override
    @Transactional(readOnly = true)
    public MedicationDrugInfoResult getDrugInfo(UUID userId, UUID scheduleId) {
        var schedule = medicationScheduleRepository
                .findByIdAndUserIdAndDeletedAtIsNull(scheduleId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        return MedicationDrugInfoResult.from(schedule);
    }
}
