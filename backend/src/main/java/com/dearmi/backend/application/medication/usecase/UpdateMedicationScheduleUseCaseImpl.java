package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.application.medication.dto.MedicationScheduleResult;
import com.dearmi.backend.application.medication.dto.UpdateMedicationScheduleCommand;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.medication.MedicationSchedule;
import com.dearmi.backend.domain.medication.MedicationScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UpdateMedicationScheduleUseCaseImpl implements UpdateMedicationScheduleUseCase {

    private final MedicationScheduleRepository medicationScheduleRepository;

    @Override
    @Transactional
    public MedicationScheduleResult update(UpdateMedicationScheduleCommand command) {
        // ④ 원칙: 소유권 검증 — 없거나 타인 소유면 404
        MedicationSchedule schedule = medicationScheduleRepository
                .findByIdAndUserIdAndDeletedAtIsNull(command.scheduleId(), command.userId())
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        schedule.update(
                command.drugName(),
                command.dosage(),
                command.drugCategory(),
                command.timesPerDay(),
                command.startDate(),
                command.endDate(),
                command.morning(),
                command.afternoon(),
                command.evening(),
                command.bedtime(),
                command.morningTime(),
                command.afternoonTime(),
                command.eveningTime(),
                command.bedtimeTime()
        );

        return MedicationScheduleResult.from(medicationScheduleRepository.save(schedule));
    }
}
