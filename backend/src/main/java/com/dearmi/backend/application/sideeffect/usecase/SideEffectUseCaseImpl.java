package com.dearmi.backend.application.sideeffect.usecase;

import com.dearmi.backend.application.sideeffect.dto.CreateSideEffectCommand;
import com.dearmi.backend.application.sideeffect.dto.SideEffectLogResult;
import com.dearmi.backend.application.sideeffect.dto.UpdateSideEffectCommand;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.medication.MedicationScheduleRepository;
import com.dearmi.backend.domain.sideeffect.SideEffectLog;
import com.dearmi.backend.domain.sideeffect.SideEffectLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SideEffectUseCaseImpl implements SideEffectUseCase {

    private final SideEffectLogRepository sideEffectLogRepository;
    private final MedicationScheduleRepository medicationScheduleRepository;

    @Override
    @Transactional
    public SideEffectLogResult create(CreateSideEffectCommand command) {
        // medicationScheduleId 가 있으면 본인 약인지 검증 (④ 원칙)
        if (command.medicationScheduleId() != null) {
            medicationScheduleRepository
                    .findByIdAndUserIdAndDeletedAtIsNull(command.medicationScheduleId(), command.userId())
                    .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));
        }

        SideEffectLog log = SideEffectLog.builder()
                .userId(command.userId())
                .medicationScheduleId(command.medicationScheduleId())
                .occurredAt(command.occurredAt())
                .symptom(command.symptom())
                .severity(command.severity())
                .notes(command.notes())
                .build();

        return SideEffectLogResult.from(sideEffectLogRepository.save(log));
    }

    @Override
    @Transactional
    public SideEffectLogResult update(UpdateSideEffectCommand command) {
        SideEffectLog log = sideEffectLogRepository
                .findByIdAndUserIdAndDeletedAtIsNull(command.logId(), command.userId())
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        if (command.medicationScheduleId() != null) {
            medicationScheduleRepository
                    .findByIdAndUserIdAndDeletedAtIsNull(command.medicationScheduleId(), command.userId())
                    .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));
        }

        log.update(command.medicationScheduleId(), command.occurredAt(),
                command.symptom(), command.severity(), command.notes());
        return SideEffectLogResult.from(sideEffectLogRepository.save(log));
    }

    @Override
    @Transactional
    public void delete(UUID userId, UUID logId) {
        SideEffectLog log = sideEffectLogRepository
                .findByIdAndUserIdAndDeletedAtIsNull(logId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));
        log.softDelete();
        sideEffectLogRepository.save(log);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SideEffectLogResult> getList(UUID userId, int page, int size) {
        return sideEffectLogRepository.findPageByUserId(userId, page * size, size).stream()
                .map(SideEffectLogResult::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long countAll(UUID userId) {
        return sideEffectLogRepository.countByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SideEffectLogResult> getSince(UUID userId, LocalDateTime since) {
        return sideEffectLogRepository.findByUserIdSince(userId, since).stream()
                .map(SideEffectLogResult::from)
                .toList();
    }
}
