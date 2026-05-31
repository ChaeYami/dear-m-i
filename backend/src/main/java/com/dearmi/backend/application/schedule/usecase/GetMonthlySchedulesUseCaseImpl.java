package com.dearmi.backend.application.schedule.usecase;

import com.dearmi.backend.application.schedule.dto.ScheduleResult;
import com.dearmi.backend.domain.record.CounselingRecordRepository;
import com.dearmi.backend.domain.schedule.HospitalSchedule;
import com.dearmi.backend.domain.schedule.HospitalScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetMonthlySchedulesUseCaseImpl implements GetMonthlySchedulesUseCase {

    private final HospitalScheduleRepository hospitalScheduleRepository;
    private final CounselingRecordRepository counselingRecordRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ScheduleResult> getMonthly(UUID userId, int year, int month) {
        List<HospitalSchedule> schedules =
                hospitalScheduleRepository.findByUserIdAndMonth(userId, year, month);

        if (schedules.isEmpty()) {
            return List.of();
        }

        List<UUID> scheduleIds = schedules.stream().map(HospitalSchedule::getId).toList();
        Set<UUID> scheduleIdsWithRecords =
                counselingRecordRepository.findScheduleIdsHavingRecords(userId, scheduleIds);

        return schedules.stream()
                .map(s -> CreateScheduleUseCaseImpl.toResult(s, scheduleIdsWithRecords.contains(s.getId())))
                .toList();
    }
}
