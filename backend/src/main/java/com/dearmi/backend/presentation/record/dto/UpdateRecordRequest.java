package com.dearmi.backend.presentation.record.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.time.LocalDate;
import java.util.List;

public record UpdateRecordRequest(
        @Min(1) @Max(10)
        Short emotionScore,

        String content,

        List<String> tags,

        LocalDate consultedAt
) {}
