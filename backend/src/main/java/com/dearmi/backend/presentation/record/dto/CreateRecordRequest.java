package com.dearmi.backend.presentation.record.dto;

import com.dearmi.backend.domain.counseling.RecordSections;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateRecordRequest(
        UUID scheduleId,

        @Min(1) @Max(10)
        Short emotionScore,

        String content,

        List<String> tags,

        LocalDate consultedAt,

        RecordSections sections,

        @Min(1) @Max(10)
        Short visitSatisfaction
) {}
