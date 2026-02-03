package com.dearmi.backend.application.record.usecase;

import com.dearmi.backend.application.record.dto.RecordTimelineResult;

import java.util.UUID;

public interface GetRecordTimelineUseCase {
    RecordTimelineResult getTimeline(UUID userId, int page, int size);
}
