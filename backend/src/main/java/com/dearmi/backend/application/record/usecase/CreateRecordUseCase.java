package com.dearmi.backend.application.record.usecase;

import com.dearmi.backend.application.record.dto.CreateRecordCommand;
import com.dearmi.backend.application.record.dto.RecordResult;

public interface CreateRecordUseCase {
    RecordResult create(CreateRecordCommand command);
}
