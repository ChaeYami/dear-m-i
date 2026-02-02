package com.dearmi.backend.application.record.usecase;

import com.dearmi.backend.application.record.dto.RecordResult;
import com.dearmi.backend.application.record.dto.UpdateRecordCommand;

public interface UpdateRecordUseCase {
    RecordResult update(UpdateRecordCommand command);
}
