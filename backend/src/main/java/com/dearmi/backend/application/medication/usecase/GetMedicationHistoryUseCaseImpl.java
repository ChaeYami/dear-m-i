package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.application.medication.dto.MedicationHistoryResult;
import com.dearmi.backend.application.medication.dto.MedicationLogResult;
import com.dearmi.backend.domain.medication.MedicationLog;
import com.dearmi.backend.domain.medication.MedicationLogRepository;
import com.dearmi.backend.domain.medication.MedicationSchedule;
import com.dearmi.backend.domain.medication.MedicationScheduleRepository;
import com.dearmi.backend.domain.subscription.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GetMedicationHistoryUseCaseImpl implements GetMedicationHistoryUseCase {

    private static final int FREE_LIMIT_DAYS = 30;

    private final MedicationLogRepository medicationLogRepository;
    private final MedicationScheduleRepository medicationScheduleRepository;
    private final SubscriptionRepository subscriptionRepository;

    @Override
    @Transactional(readOnly = true)
    public MedicationHistoryResult getHistory(UUID userId, LocalDate startDate, LocalDate endDate) {
        LocalDate today = LocalDate.now();

        // 플랜 체크: 무료이면 최근 30일 강제
        boolean isPremium = subscriptionRepository.findByUserId(userId)
                .map(s -> s.isPremium())
                .orElse(false);

        if (!isPremium) {
            LocalDate freeLimit = today.minusDays(FREE_LIMIT_DAYS);
            if (startDate == null || startDate.isBefore(freeLimit)) {
                startDate = freeLimit;
            }
        }

        LocalDate effectiveStart = startDate != null ? startDate : today.minusDays(FREE_LIMIT_DAYS);
        LocalDate effectiveEnd = endDate != null ? endDate : today;

        List<MedicationLog> rawLogs = medicationLogRepository
                .findByUserIdAndLogDateBetweenOrderByLogDateDesc(userId, effectiveStart, effectiveEnd);

        // scheduleId → drugName 일괄 조회 (N+1 방지)
        Map<UUID, String> drugNameMap = medicationScheduleRepository.findByUserIdAndDeletedAtIsNull(userId)
                .stream()
                .collect(Collectors.toMap(MedicationSchedule::getId, MedicationSchedule::getDrugName, (a, b) -> a));

        List<MedicationLogResult> logs = rawLogs.stream()
                .map(log -> MedicationLogResult.from(log, drugNameMap.getOrDefault(log.getMedicationScheduleId(), "")))
                .toList();

        return new MedicationHistoryResult(effectiveStart, effectiveEnd, logs);
    }
}
