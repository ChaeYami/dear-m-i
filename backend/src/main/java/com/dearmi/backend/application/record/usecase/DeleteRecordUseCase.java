package com.dearmi.backend.application.record.usecase;

import java.util.UUID;

public interface DeleteRecordUseCase {
    void delete(UUID userId, UUID recordId);
}
