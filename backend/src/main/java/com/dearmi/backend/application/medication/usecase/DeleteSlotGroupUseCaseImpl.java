package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.medication.MedicationScheduleRepository;
import com.dearmi.backend.domain.medication.MedicationSlotGroupRepository;
import com.dearmi.backend.domain.medication.TimeSlot;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DeleteSlotGroupUseCaseImpl implements DeleteSlotGroupUseCase {

    private final MedicationSlotGroupRepository slotGroupRepository;
    private final MedicationScheduleRepository medicationScheduleRepository;

    @Override
    @Transactional
    public void delete(UUID userId, UUID groupId) {
        var group = slotGroupRepository.findByIdAndUserIdAndDeletedAtIsNull(groupId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        // 연결된 슬롯의 그룹 참조를 null로 해제
        var schedules = medicationScheduleRepository.findByUserIdAndDeletedAtIsNull(userId);
        for (var schedule : schedules) {
            boolean modified = false;
            for (TimeSlot slot : TimeSlot.values()) {
                if (groupId.equals(schedule.getGroupId(slot))) {
                    schedule.assignGroup(slot, null);
                    modified = true;
                }
            }
            if (modified) medicationScheduleRepository.save(schedule);
        }

        group.softDelete();
        slotGroupRepository.save(group);
    }
}
