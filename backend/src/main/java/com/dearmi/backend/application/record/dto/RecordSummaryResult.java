package com.dearmi.backend.application.record.dto;

import com.dearmi.backend.domain.counseling.CounselingRecord;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** 타임라인 목록용 요약 DTO (content 제외) */
public record RecordSummaryResult(
        UUID id,
        UUID scheduleId,
        Short emotionScore,
        List<String> tags,
        LocalDateTime createdAt
) {
    public static RecordSummaryResult from(CounselingRecord r) {
        return new RecordSummaryResult(
                r.getId(),
                r.getScheduleId(),
                r.getEmotionScore(),
                r.getTags(),
                r.getCreatedAt()
        );
    }
}
