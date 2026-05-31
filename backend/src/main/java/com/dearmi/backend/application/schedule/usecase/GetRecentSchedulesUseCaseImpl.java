package com.dearmi.backend.application.schedule.usecase;

import com.dearmi.backend.application.schedule.dto.ScheduleResult;
import com.dearmi.backend.domain.counseling.CounselingRecordRepository;
import com.dearmi.backend.domain.schedule.HospitalSchedule;
import com.dearmi.backend.domain.schedule.HospitalScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetRecentSchedulesUseCaseImpl implements GetRecentSchedulesUseCase {

    private final HospitalScheduleRepository hospitalScheduleRepository;
    private final CounselingRecordRepository counselingRecordRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ScheduleResult> get(UUID userId, Direction direction, int limit) {
        LocalDateTime now = LocalDateTime.now();

        List<HospitalSchedule> schedules = switch (direction) {
            case PAST -> hospitalScheduleRepository.findPastByUserId(userId, now, limit);
            case FUTURE -> hospitalScheduleRepository.findFutureByUserId(userId, now, limit);
        };

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
