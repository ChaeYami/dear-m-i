package com.dearmi.backend.application.record.dto;

import java.util.List;
import java.util.UUID;

public record UpdateRecordCommand(
        UUID userId,
        UUID recordId,
        Short emotionScore,
        String content,
        List<String> tags
) {}
