package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.medication.MedicationLogRepository;
import com.dearmi.backend.domain.medication.MedicationScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UncheckMedicationUseCaseImpl implements UncheckMedicationUseCase {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final MedicationScheduleRepository medicationScheduleRepository;
    private final MedicationLogRepository medicationLogRepository;

    @Override
    @Transactional
    public void uncheck(UUID userId, UUID scheduleId, LocalDate logDate, String timeSlot) {
        // 미래 날짜 차단
        if (logDate.isAfter(LocalDate.now(SEOUL))) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }

        // ④ 원칙: 소유권 검증
        medicationScheduleRepository
                .findByIdAndUserIdAndDeletedAtIsNull(scheduleId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        medicationLogRepository
                .findByMedicationScheduleIdAndLogDateAndTimeSlot(scheduleId, logDate, timeSlot)
                .ifPresent(medicationLogRepository::delete);
    }
}
