package com.dearmi.backend.application.record.dto;

import com.dearmi.backend.domain.counseling.RecordSections;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record UpdateRecordCommand(
        UUID userId,
        UUID recordId,
        Short emotionScore,
        String content,
        List<String> tags,
        LocalDate consultedAt,
        RecordSections sections,
        Short visitSatisfaction
) {}
