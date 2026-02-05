package com.dearmi.backend.presentation.record.dto;

import com.dearmi.backend.application.record.dto.RecordSummaryResult;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record RecordSummaryResponse(
        UUID id,
        UUID scheduleId,
        String hospitalName,
        Short emotionScore,
        String content,
        List<String> tags,
        LocalDate consultedAt,
        LocalDateTime createdAt
) {
    public static RecordSummaryResponse from(RecordSummaryResult result) {
        return new RecordSummaryResponse(
                result.id(),
                result.scheduleId(),
                result.hospitalName(),
                result.emotionScore(),
                result.content(),
                result.tags(),
                result.consultedAt(),
                result.createdAt()
        );
    }
}
