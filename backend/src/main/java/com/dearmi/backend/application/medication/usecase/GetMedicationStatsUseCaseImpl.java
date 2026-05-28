package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.application.medication.dto.MedicationStatsResult;
import com.dearmi.backend.domain.medication.MedicationLogRepository;
import com.dearmi.backend.domain.medication.MedicationLogStatus;
import com.dearmi.backend.domain.medication.MedicationSchedule;
import com.dearmi.backend.domain.medication.MedicationScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetMedicationStatsUseCaseImpl implements GetMedicationStatsUseCase {

    private final MedicationLogRepository medicationLogRepository;
    private final MedicationScheduleRepository medicationScheduleRepository;

    @Override
    @Transactional(readOnly = true)
    public MedicationStatsResult getStats(UUID userId, LocalDate startDate, LocalDate endDate) {
        LocalDate today = LocalDate.now();
        LocalDate effectiveStart = startDate != null ? startDate : today.minusDays(30);
        LocalDate effectiveEnd = endDate != null ? endDate : today;
        // 예정 복용 횟수는 "오늘까지"만 — 미래 슬롯은 미복용이 아님
        LocalDate cappedEnd = effectiveEnd.isAfter(today) ? today : effectiveEnd;

        long totalLogs = medicationLogRepository
                .countByUserIdAndLogDateBetween(userId, effectiveStart, effectiveEnd);
        long takenCount = medicationLogRepository
                .countByUserIdAndLogDateBetweenAndStatus(userId, effectiveStart, effectiveEnd,
                        MedicationLogStatus.TAKEN.name());
        long skippedCount = medicationLogRepository
                .countByUserIdAndLogDateBetweenAndStatus(userId, effectiveStart, effectiveEnd,
                        MedicationLogStatus.SKIPPED.name());

        // 기간 내 예정 복용 횟수 = Σ(활성 일정의 활성 슬롯 수 × 기간∩일정기간 일수)
        long scheduledDoses = 0;
        if (!cappedEnd.isBefore(effectiveStart)) {
            for (MedicationSchedule s : medicationScheduleRepository.findByUserIdAndDeletedAtIsNull(userId)) {
                if (s.getStartDate() == null) continue;
                LocalDate winStart = s.getStartDate().isAfter(effectiveStart) ? s.getStartDate() : effectiveStart;
                LocalDate scheduleEnd = s.getEndDate() != null ? s.getEndDate() : cappedEnd;
                LocalDate winEnd = scheduleEnd.isBefore(cappedEnd) ? scheduleEnd : cappedEnd;
                if (winEnd.isBefore(winStart)) continue;

                long days = ChronoUnit.DAYS.between(winStart, winEnd) + 1;
                int slots = (Boolean.TRUE.equals(s.getMorning()) ? 1 : 0)
                        + (Boolean.TRUE.equals(s.getAfternoon()) ? 1 : 0)
                        + (Boolean.TRUE.equals(s.getEvening()) ? 1 : 0)
                        + (Boolean.TRUE.equals(s.getBedtime()) ? 1 : 0);
                scheduledDoses += days * slots;
            }
        }

        // 삭제된 일정의 과거 로그 등으로 taken+skipped 가 예정치를 초과할 수 있어 하한 보정 (rate ≤ 100%, missed ≥ 0)
        long actedCount = takenCount + skippedCount;
        if (scheduledDoses < actedCount) scheduledDoses = actedCount;
        long missedCount = scheduledDoses - actedCount;

        double completionRate = scheduledDoses > 0
                ? Math.round(takenCount * 1000.0 / scheduledDoses) / 10.0   // 소수점 1자리
                : 0.0;

        return new MedicationStatsResult(
                effectiveStart, effectiveEnd, totalLogs, scheduledDoses,
                takenCount, skippedCount, missedCount, completionRate);
    }
}
