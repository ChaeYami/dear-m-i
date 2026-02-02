package com.dearmi.backend.application.record.usecase;

import com.dearmi.backend.application.record.dto.RecordResult;

import java.util.UUID;

public interface GetRecordDetailUseCase {
    RecordResult getDetail(UUID userId, UUID recordId);
}
