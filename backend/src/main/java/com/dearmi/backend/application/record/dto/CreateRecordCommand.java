package com.dearmi.backend.application.record.dto;

import java.util.List;
import java.util.UUID;

public record CreateRecordCommand(
        UUID userId,
        UUID scheduleId,      // nullable
        Short emotionScore,   // nullable, 1~10
        String content,       // nullable
        List<String> tags     // nullable
) {}
