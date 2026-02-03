package com.dearmi.backend.application.checkin.usecase;

import com.dearmi.backend.application.checkin.dto.CheckinHistoryResult;
import com.dearmi.backend.application.checkin.dto.CheckinResult;
import com.dearmi.backend.domain.checkin.DailyCheckinRepository;
import com.dearmi.backend.domain.subscription.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetCheckinHistoryUseCaseImpl implements GetCheckinHistoryUseCase {

    private static final int FREE_LIMIT_DAYS = 30;

    private final DailyCheckinRepository dailyCheckinRepository;
    private final SubscriptionRepository subscriptionRepository;

    @Override
    @Transactional(readOnly = true)
    public CheckinHistoryResult getHistory(UUID userId, LocalDate startDate, LocalDate endDate) {
        boolean isPremium = subscriptionRepository.findByUserId(userId)
                .map(s -> s.isPremium())
                .orElse(false);

        boolean isLimited = false;
        LocalDate effectiveStart = startDate;

        if (!isPremium) {
            LocalDate freeCutoff = LocalDate.now().minusDays(FREE_LIMIT_DAYS);
            if (effectiveStart == null || effectiveStart.isBefore(freeCutoff)) {
                effectiveStart = freeCutoff;
                isLimited = true;
            }
        }

        if (effectiveStart == null) {
            effectiveStart = LocalDate.of(2020, 1, 1);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }

        List<CheckinResult> content = dailyCheckinRepository
                .findByUserIdAndCheckedAtBetweenOrderByCheckedAtDesc(userId, effectiveStart, endDate)
                .stream()
                .map(CheckinResult::from)
                .toList();

        return new CheckinHistoryResult(content, isLimited);
    }
}
