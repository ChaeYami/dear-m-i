package com.dearmi.backend.application.prescription.usecase;

import com.dearmi.backend.application.prescription.dto.GenerateUploadUrlCommand;
import com.dearmi.backend.application.prescription.dto.GenerateUploadUrlResult;

public interface GenerateUploadUrlUseCase {
    GenerateUploadUrlResult generate(GenerateUploadUrlCommand command);
}
