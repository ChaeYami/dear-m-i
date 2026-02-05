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
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

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

        // 연결된 일정의 hospitalName 일괄 조회 (N+1 방지)
        Map<UUID, String> scheduleNames = records.stream()
                .map(CounselingRecord::getScheduleId)
                .filter(id -> id != null)
                .distinct()
                .map(id -> hospitalScheduleRepository.findByIdAndUserIdAndDeletedAtIsNull(id, userId).orElse(null))
                .filter(s -> s != null)
                .collect(Collectors.toMap(HospitalSchedule::getId, HospitalSchedule::getHospitalName));

        List<RecordSummaryResult> content = records.stream()
                .map(r -> RecordSummaryResult.of(
                        r,
                        r.getScheduleId() != null ? scheduleNames.get(r.getScheduleId()) : null
                ))
                .toList();

        return RecordTimelineResult.of(content, page, size, total, isLimited);
    }
}
