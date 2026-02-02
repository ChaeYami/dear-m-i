package com.dearmi.backend.application.record.usecase;

import com.dearmi.backend.application.record.dto.PageResult;
import com.dearmi.backend.application.record.dto.RecordSummaryResult;

import java.util.UUID;

public interface GetRecordTimelineUseCase {
    PageResult<RecordSummaryResult> getTimeline(UUID userId, int page, int size);
}
