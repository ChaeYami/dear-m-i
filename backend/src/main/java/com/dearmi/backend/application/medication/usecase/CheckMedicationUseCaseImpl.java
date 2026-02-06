package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.application.medication.dto.CheckMedicationCommand;
import com.dearmi.backend.application.medication.dto.MedicationLogResult;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.medication.MedicationLog;
import com.dearmi.backend.domain.medication.MedicationLogRepository;
import com.dearmi.backend.domain.medication.MedicationScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CheckMedicationUseCaseImpl implements CheckMedicationUseCase {

    private final MedicationScheduleRepository medicationScheduleRepository;
    private final MedicationLogRepository medicationLogRepository;

    @Override
    @Transactional
    public MedicationLogResult check(CheckMedicationCommand command) {
        // 미래 날짜 체크 차단
        if (command.logDate().isAfter(LocalDate.now())) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }

        // ④ 원칙: 복약 일정 소유권 검증
        var schedule = medicationScheduleRepository
                .findByIdAndUserIdAndDeletedAtIsNull(command.scheduleId(), command.userId())
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        // UPSERT: (scheduleId, logDate, timeSlot) 기준
        Optional<MedicationLog> existing = medicationLogRepository
                .findByMedicationScheduleIdAndLogDateAndTimeSlot(
                        command.scheduleId(),
                        command.logDate(),
                        command.timeSlot().name()
                );

        MedicationLog log;
        if (existing.isPresent()) {
            // 기존 로그 상태 업데이트
            log = existing.get();
            log.updateStatus(command.status());
            log = medicationLogRepository.save(log);
        } else {
            // 새 로그 생성
            log = MedicationLog.builder()
                    .medicationScheduleId(command.scheduleId())
                    .userId(command.userId())
                    .logDate(command.logDate())
                    .timeSlot(command.timeSlot().name())
                    .status(command.status().name())
                    .takenAt(command.status().name().equals("TAKEN") ? LocalDateTime.now() : null)
                    .build();
            log = medicationLogRepository.save(log);
        }

        return MedicationLogResult.from(log, schedule.getDrugName());
    }
}
