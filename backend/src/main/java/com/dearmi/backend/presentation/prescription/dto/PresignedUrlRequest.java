package com.dearmi.backend.presentation.prescription.dto;

import jakarta.validation.constraints.NotBlank;

public record PresignedUrlRequest(
        @NotBlank String fileName,
        @NotBlank String contentType
) {}
