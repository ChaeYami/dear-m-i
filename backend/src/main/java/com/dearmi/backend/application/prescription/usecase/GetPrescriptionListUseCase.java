package com.dearmi.backend.application.prescription.usecase;

import com.dearmi.backend.application.prescription.dto.PrescriptionResult;
import com.dearmi.backend.application.record.dto.PageResult;

import java.util.UUID;

public interface GetPrescriptionListUseCase {
    PageResult<PrescriptionResult> getList(UUID userId, int page, int size);
}
