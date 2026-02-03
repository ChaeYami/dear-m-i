package com.dearmi.backend.application.search.dto;

import com.dearmi.backend.domain.counseling.CounselingRecord;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record RecordSearchResult(
        UUID id,
        UUID scheduleId,
        Short emotionScore,
        String content,
        List<String> tags,
        LocalDateTime createdAt
) {
    public static RecordSearchResult from(CounselingRecord record) {
        return new RecordSearchResult(
                record.getId(),
                record.getScheduleId(),
                record.getEmotionScore(),
                record.getContent(),
                record.getTags(),
                record.getCreatedAt()
        );
    }
}
