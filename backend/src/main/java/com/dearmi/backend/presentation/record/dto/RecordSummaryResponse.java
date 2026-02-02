package com.dearmi.backend.presentation.record.dto;

import com.dearmi.backend.application.record.dto.RecordSummaryResult;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record RecordSummaryResponse(
        UUID id,
        UUID scheduleId,
        Short emotionScore,
        List<String> tags,
        LocalDateTime createdAt
) {
    public static RecordSummaryResponse from(RecordSummaryResult result) {
        return new RecordSummaryResponse(
                result.id(),
                result.scheduleId(),
                result.emotionScore(),
                result.tags(),
                result.createdAt()
        );
    }
}
