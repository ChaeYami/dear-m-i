package com.dearmi.backend.application.record.usecase;

import com.dearmi.backend.application.record.dto.RecordSummaryResult;
import com.dearmi.backend.application.record.dto.RecordTimelineResult;
import com.dearmi.backend.domain.counseling.CounselingRecordRepository;
import com.dearmi.backend.domain.subscription.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetRecordTimelineUseCaseImpl implements GetRecordTimelineUseCase {

    private static final int FREE_LIMIT_MONTHS = 2;

    private final CounselingRecordRepository counselingRecordRepository;
    private final SubscriptionRepository subscriptionRepository;

    @Override
    @Transactional(readOnly = true)
    public RecordTimelineResult getTimeline(UUID userId, int page, int size) {
        boolean isPremium = subscriptionRepository.findByUserId(userId)
                .map(s -> s.isPremium())
                .orElse(false);

        int offset = page * size;

        if (isPremium) {
            List<RecordSummaryResult> content = counselingRecordRepository
                    .findByUserIdOrderByCreatedAtDesc(userId, offset, size)
                    .stream()
                    .map(RecordSummaryResult::from)
                    .toList();
            long total = counselingRecordRepository.countByUserIdAndDeletedAtIsNull(userId);
            return RecordTimelineResult.of(content, page, size, total, false);
        } else {
            LocalDateTime cutoff = LocalDateTime.now().minusMonths(FREE_LIMIT_MONTHS);
            List<RecordSummaryResult> content = counselingRecordRepository
                    .findByUserIdAndDeletedAtIsNullAndCreatedAtAfterOrderByCreatedAtDesc(userId, cutoff, offset, size)
                    .stream()
                    .map(RecordSummaryResult::from)
                    .toList();
            long total = counselingRecordRepository
                    .countByUserIdAndDeletedAtIsNullAndCreatedAtAfter(userId, cutoff);
            return RecordTimelineResult.of(content, page, size, total, true);
        }
    }
}
