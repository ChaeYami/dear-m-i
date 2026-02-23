package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.medication.MedicationScheduleRepository;
import com.dearmi.backend.domain.medication.MedicationSlotGroupRepository;
import com.dearmi.backend.domain.medication.TimeSlot;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AssignSlotGroupUseCaseImpl implements AssignSlotGroupUseCase {

    private final MedicationScheduleRepository medicationScheduleRepository;
    private final MedicationSlotGroupRepository slotGroupRepository;

    @Override
    @Transactional
    public void assign(UUID userId, UUID scheduleId, List<String> timeSlots, UUID groupId) {
        // ④ 원칙: 소유권 검증
        var schedule = medicationScheduleRepository
                .findByIdAndUserIdAndDeletedAtIsNull(scheduleId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        // groupId != null이면 그룹 소유권 검증
        if (groupId != null) {
            slotGroupRepository.findByIdAndUserIdAndDeletedAtIsNull(groupId, userId)
                    .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));
        }

        for (String slotName : timeSlots) {
            TimeSlot slot = TimeSlot.valueOf(slotName);
            schedule.assignGroup(slot, groupId);
        }

        medicationScheduleRepository.save(schedule);
    }
}
