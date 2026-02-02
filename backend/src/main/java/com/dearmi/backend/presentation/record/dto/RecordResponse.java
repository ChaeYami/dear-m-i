package com.dearmi.backend.presentation.record.dto;

import com.dearmi.backend.application.record.dto.RecordResult;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record RecordResponse(
        UUID id,
        UUID scheduleId,
        Short emotionScore,
        String content,
        List<String> tags,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static RecordResponse from(RecordResult result) {
        return new RecordResponse(
                result.id(),
                result.scheduleId(),
                result.emotionScore(),
                result.content(),
                result.tags(),
                result.createdAt(),
                result.updatedAt()
        );
    }
}
