package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.application.medication.dto.MedicationStatsResult;
import com.dearmi.backend.domain.medication.MedicationLogRepository;
import com.dearmi.backend.domain.medication.MedicationLogStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetMedicationStatsUseCaseImpl implements GetMedicationStatsUseCase {

    private final MedicationLogRepository medicationLogRepository;

    @Override
    @Transactional(readOnly = true)
    public MedicationStatsResult getStats(UUID userId, LocalDate startDate, LocalDate endDate) {
        LocalDate effectiveStart = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate effectiveEnd = endDate != null ? endDate : LocalDate.now();

        long totalLogs = medicationLogRepository
                .countByUserIdAndLogDateBetween(userId, effectiveStart, effectiveEnd);
        long takenCount = medicationLogRepository
                .countByUserIdAndLogDateBetweenAndStatus(userId, effectiveStart, effectiveEnd,
                        MedicationLogStatus.TAKEN.name());
        long skippedCount = medicationLogRepository
                .countByUserIdAndLogDateBetweenAndStatus(userId, effectiveStart, effectiveEnd,
                        MedicationLogStatus.SKIPPED.name());

        double completionRate = totalLogs > 0
                ? Math.round(takenCount * 1000.0 / totalLogs) / 10.0   // 소수점 1자리
                : 0.0;

        return new MedicationStatsResult(effectiveStart, effectiveEnd, totalLogs, takenCount, skippedCount, completionRate);
    }
}
