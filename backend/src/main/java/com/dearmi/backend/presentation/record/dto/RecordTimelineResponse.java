package com.dearmi.backend.presentation.record.dto;

import com.dearmi.backend.application.record.dto.RecordTimelineResult;

import java.util.List;

public record RecordTimelineResponse(
        List<RecordSummaryResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean isLimited
) {
    public static RecordTimelineResponse from(RecordTimelineResult result) {
        return new RecordTimelineResponse(
                result.content().stream().map(RecordSummaryResponse::from).toList(),
                result.page(),
                result.size(),
                result.totalElements(),
                result.totalPages(),
                result.isLimited()
        );
    }
}
