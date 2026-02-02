package com.dearmi.backend.presentation.record.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.util.List;
import java.util.UUID;

public record CreateRecordRequest(
        UUID scheduleId,

        @Min(1) @Max(10)
        Short emotionScore,

        String content,

        List<String> tags
) {}
