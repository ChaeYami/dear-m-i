package com.dearmi.backend.application.prescription.dto;

import java.util.UUID;

public record GenerateUploadUrlCommand(UUID userId, String fileName, String contentType) {}
