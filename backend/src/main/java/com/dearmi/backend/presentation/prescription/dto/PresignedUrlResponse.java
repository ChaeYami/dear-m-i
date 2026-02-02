package com.dearmi.backend.presentation.prescription.dto;

import com.dearmi.backend.application.prescription.dto.GenerateUploadUrlResult;

public record PresignedUrlResponse(String s3Key, String uploadUrl) {
    public static PresignedUrlResponse from(GenerateUploadUrlResult result) {
        return new PresignedUrlResponse(result.s3Key(), result.uploadUrl());
    }
}
