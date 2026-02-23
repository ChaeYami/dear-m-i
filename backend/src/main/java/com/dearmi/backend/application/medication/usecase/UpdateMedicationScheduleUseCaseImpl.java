package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.application.medication.dto.MedicationScheduleResult;
import com.dearmi.backend.application.medication.dto.UpdateMedicationScheduleCommand;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.medication.MedicationSchedule;
import com.dearmi.backend.domain.medication.MedicationScheduleRepository;
import com.dearmi.backend.domain.medication.TimeSlot;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UpdateMedicationScheduleUseCaseImpl implements UpdateMedicationScheduleUseCase {

    private final MedicationScheduleRepository medicationScheduleRepository;

    @Override
    @Transactional
    public MedicationScheduleResult update(UpdateMedicationScheduleCommand command) {
        MedicationSchedule schedule = medicationScheduleRepository
                .findByIdAndUserIdAndDeletedAtIsNull(command.scheduleId(), command.userId())
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        // 슬롯 시간 변경 감지 → 그룹 멤버 동기화
        for (TimeSlot slot : TimeSlot.values()) {
            LocalTime oldTime = schedule.getSlotTime(slot);
            LocalTime newTime = getCommandSlotTime(command, slot);
            if (newTime != null && !newTime.equals(oldTime)) {
                java.util.UUID groupId = schedule.getGroupId(slot);
                if (groupId != null) {
                    List<MedicationSchedule> members = medicationScheduleRepository.findAllBySlotGroupId(groupId, slot);
                    for (MedicationSchedule member : members) {
                        if (!member.getId().equals(command.scheduleId())) {
                            member.updateSlotTime(slot, newTime);
                            medicationScheduleRepository.save(member);
                        }
                    }
                }
            }
        }

        schedule.update(
                command.drugName(),
                command.dosage(),
                command.singleDose(),
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

    private LocalTime getCommandSlotTime(UpdateMedicationScheduleCommand cmd, TimeSlot slot) {
        return switch (slot) {
            case MORNING   -> cmd.morningTime();
            case AFTERNOON -> cmd.afternoonTime();
            case EVENING   -> cmd.eveningTime();
            case BEDTIME   -> cmd.bedtimeTime();
        };
    }
}
