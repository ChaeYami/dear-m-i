package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.application.medication.dto.TodayMedicationResult;
import com.dearmi.backend.application.medication.dto.TodayMedicationResult.ScheduleWithLogs;
import com.dearmi.backend.application.medication.dto.TodayMedicationResult.SlotLog;
import com.dearmi.backend.domain.medication.MedicationLog;
import com.dearmi.backend.domain.medication.MedicationLogRepository;
import com.dearmi.backend.domain.medication.MedicationSchedule;
import com.dearmi.backend.domain.medication.MedicationScheduleRepository;
import com.dearmi.backend.domain.medication.MedicationSlotGroup;
import com.dearmi.backend.domain.medication.MedicationSlotGroupRepository;
import com.dearmi.backend.domain.medication.TimeSlot;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GetTodayMedicationUseCaseImpl implements GetTodayMedicationUseCase {

    // 서버 JVM 이 UTC 인 환경(ECS Fargate 등)에서 사용자의 '오늘' 과 어긋나지 않도록
    // NotificationScheduler 와 동일하게 KST 기준으로 오늘을 계산한다.
    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final MedicationScheduleRepository medicationScheduleRepository;
    private final MedicationLogRepository medicationLogRepository;
    private final MedicationSlotGroupRepository slotGroupRepository;

    @Override
    @Transactional(readOnly = true)
    public TodayMedicationResult getToday(UUID userId) {
        return getForDate(userId, LocalDate.now(SEOUL));
    }

    @Override
    @Transactional(readOnly = true)
    public TodayMedicationResult getForDate(UUID userId, LocalDate date) {
        List<MedicationSchedule> schedules =
                medicationScheduleRepository.findActiveForDateAndUserId(date, userId);
        List<ScheduleWithLogs> result = schedules.stream()
                .map(s -> toScheduleWithLogs(s, date))
                .toList();
        return new TodayMedicationResult(result);
    }

    private ScheduleWithLogs toScheduleWithLogs(MedicationSchedule s, LocalDate date) {
        // 해당 날짜의 모든 로그를 time_slot 기준으로 Map화
        List<MedicationLog> logs = medicationLogRepository
                .findByMedicationScheduleIdAndLogDate(s.getId(), date);
        Map<String, MedicationLog> logBySlot = logs.stream()
                .collect(Collectors.toMap(MedicationLog::getTimeSlot, Function.identity()));

        List<SlotLog> slots = new ArrayList<>();
        if (Boolean.TRUE.equals(s.getMorning())) {
            slots.add(buildSlotLog(TimeSlot.MORNING, s.getMorningTime(), logBySlot, s));
        }
        if (Boolean.TRUE.equals(s.getAfternoon())) {
            slots.add(buildSlotLog(TimeSlot.AFTERNOON, s.getAfternoonTime(), logBySlot, s));
        }
        if (Boolean.TRUE.equals(s.getEvening())) {
            slots.add(buildSlotLog(TimeSlot.EVENING, s.getEveningTime(), logBySlot, s));
        }
        if (Boolean.TRUE.equals(s.getBedtime())) {
            slots.add(buildSlotLog(TimeSlot.BEDTIME, s.getBedtimeTime(), logBySlot, s));
        }

        return new ScheduleWithLogs(
                s.getId(),
                s.getDrugName(),
                s.getDosage(),
                s.getTimesPerDay(),
                s.getStartDate(),
                s.getEndDate(),
                slots
        );
    }

    private SlotLog buildSlotLog(TimeSlot slot, LocalTime notifyTime,
                                  Map<String, MedicationLog> logBySlot,
                                  MedicationSchedule schedule) {
        MedicationLog log = logBySlot.get(slot.name());
        UUID groupId = schedule.getGroupId(slot);
        String groupName = groupId != null
                ? slotGroupRepository.findByIdAndUserIdAndDeletedAtIsNull(groupId, schedule.getUserId())
                        .map(MedicationSlotGroup::getGroupName)
                        .orElse(null)
                : null;
        return new SlotLog(
                slot.name(),
                notifyTime,
                log != null ? log.getStatus() : null,
                log != null ? log.getId() : null,
                groupId,
                groupName
        );
    }
}
