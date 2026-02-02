package com.dearmi.backend.application.record.usecase;

import com.dearmi.backend.application.record.dto.PageResult;
import com.dearmi.backend.application.record.dto.RecordSummaryResult;
import com.dearmi.backend.domain.counseling.CounselingRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetRecordTimelineUseCaseImpl implements GetRecordTimelineUseCase {

    private final CounselingRecordRepository counselingRecordRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResult<RecordSummaryResult> getTimeline(UUID userId, int page, int size) {
        int offset = page * size;
        List<RecordSummaryResult> content = counselingRecordRepository
                .findByUserIdOrderByCreatedAtDesc(userId, offset, size)
                .stream()
                .map(RecordSummaryResult::from)
                .toList();

        long total = counselingRecordRepository.countByUserIdAndDeletedAtIsNull(userId);
        return PageResult.of(content, page, size, total);
    }
}
