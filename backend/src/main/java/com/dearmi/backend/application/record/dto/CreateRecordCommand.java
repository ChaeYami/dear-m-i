package com.dearmi.backend.application.record.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateRecordCommand(
        UUID userId,
        UUID scheduleId,      // nullable
        Short emotionScore,   // nullable, 1~10
        String content,       // nullable
        List<String> tags,    // nullable
        LocalDate consultedAt // nullable — 일정 미연결 시 사용
) {}
