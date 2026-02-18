package com.dearmi.backend.application.record.dto;

import com.dearmi.backend.domain.counseling.RecordSections;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateRecordCommand(
        UUID userId,
        UUID scheduleId,           // nullable
        Short emotionScore,        // nullable, 1~10
        String content,            // nullable
        List<String> tags,         // nullable
        LocalDate consultedAt,     // nullable — 일정 미연결 시 사용
        RecordSections sections,   // nullable — 비면 빈 객체로 저장
        Short visitSatisfaction    // nullable, 1~10 — 진료 자체에 대한 만족도
) {}
