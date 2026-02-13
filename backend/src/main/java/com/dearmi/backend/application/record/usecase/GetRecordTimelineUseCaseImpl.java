package com.dearmi.backend.application.record.usecase;

import com.dearmi.backend.application.record.dto.RecordSummaryResult;
import com.dearmi.backend.application.record.dto.RecordTimelineResult;
import com.dearmi.backend.domain.counseling.CounselingRecord;
import com.dearmi.backend.domain.counseling.CounselingRecordRepository;
import com.dearmi.backend.domain.hospital.HospitalSchedule;
import com.dearmi.backend.domain.hospital.HospitalScheduleRepository;
import com.dearmi.backend.domain.subscription.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetRecordTimelineUseCaseImpl implements GetRecordTimelineUseCase {

    private static final int FREE_LIMIT_MONTHS = 2;

    private final CounselingRecordRepository counselingRecordRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final HospitalScheduleRepository hospitalScheduleRepository;

    @Override
    @Transactional(readOnly = true)
    public RecordTimelineResult getTimeline(UUID userId, int page, int size) {
        boolean isPremium = subscriptionRepository.findByUserId(userId)
                .map(s -> s.isPremium())
                .orElse(false);

        int offset = page * size;
        List<CounselingRecord> records;
        long total;
        boolean isLimited;

        if (isPremium) {
            records = counselingRecordRepository.findByUserIdOrderByCreatedAtDesc(userId, offset, size);
            total = counselingRecordRepository.countByUserIdAndDeletedAtIsNull(userId);
            isLimited = false;
        } else {
            LocalDateTime cutoff = LocalDateTime.now().minusMonths(FREE_LIMIT_MONTHS);
            records = counselingRecordRepository
                    .findByUserIdAndDeletedAtIsNullAndCreatedAtAfterOrderByCreatedAtDesc(userId, cutoff, offset, size);
            total = counselingRecordRepository
                    .countByUserIdAndDeletedAtIsNullAndCreatedAtAfter(userId, cutoff);
            isLimited = true;
        }

        // 연결된 일정 일괄 조회 (N+1 방지) — hospitalName + scheduledAt 둘 다 사용
        Map<UUID, HospitalSchedule> scheduleMap = new HashMap<>();
        records.stream()
                .map(CounselingRecord::getScheduleId)
                .filter(id -> id != null)
                .distinct()
                .forEach(id -> hospitalScheduleRepository
                        .findByIdAndUserIdAndDeletedAtIsNull(id, userId)
                        .ifPresent(s -> scheduleMap.put(s.getId(), s)));

        List<RecordSummaryResult> content = records.stream()
                .map(r -> {
                    HospitalSchedule linked = r.getScheduleId() != null ? scheduleMap.get(r.getScheduleId()) : null;
                    return RecordSummaryResult.of(
                            r,
                            linked != null ? linked.getHospitalName() : null,
                            linked != null ? linked.getScheduledAt() : null
                    );
                })
                .toList();

        return RecordTimelineResult.of(content, page, size, total, isLimited);
    }
}
