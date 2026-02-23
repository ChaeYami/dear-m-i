package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.application.medication.dto.CheckMedicationCommand;
import com.dearmi.backend.domain.medication.MedicationLogStatus;
import com.dearmi.backend.domain.medication.MedicationSchedule;
import com.dearmi.backend.domain.medication.MedicationScheduleRepository;
import com.dearmi.backend.domain.medication.TimeSlot;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BulkCheckGroupMedicationUseCaseImpl implements BulkCheckGroupMedicationUseCase {

    private final MedicationScheduleRepository medicationScheduleRepository;
    private final CheckMedicationUseCase checkMedicationUseCase;

    @Override
    @Transactional
    public void bulkCheck(UUID userId, UUID groupId, TimeSlot timeSlot, LocalDate logDate, MedicationLogStatus status) {
        List<MedicationSchedule> schedules = medicationScheduleRepository.findAllBySlotGroupId(groupId, timeSlot);
        log.debug("그룹 일괄 체크: groupId={}, slot={}, count={}, status={}", groupId, timeSlot, schedules.size(), status);

        for (MedicationSchedule schedule : schedules) {
            // 원칙 ④: 소유권 검증 — 그룹이 타인 소유인 경우 건너뜀
            if (!schedule.getUserId().equals(userId)) continue;

            try {
                checkMedicationUseCase.check(new CheckMedicationCommand(
                        userId, schedule.getId(), logDate, timeSlot, status
                ));
            } catch (Exception e) {
                log.warn("그룹 체크 실패: scheduleId={}, error={}", schedule.getId(), e.getMessage());
            }
        }
    }
}
