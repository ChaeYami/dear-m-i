package com.dearmi.backend.application.prepnote.dto;

import com.dearmi.backend.domain.prepnote.PrepNoteSections;

import java.util.List;
import java.util.UUID;

public record CreatePrepNoteCommand(
        UUID userId,
        UUID scheduleId,          // nullable
        String content,           // freeform 자유 메모 / legacy
        PrepNoteSections sections, // 정신과 구조화 섹션 (nullable — 비면 빈 객체로 저장)
        List<UUID> linkedNoteIds  // 선택된 DailyNote ID 목록 (nullable)
) {}
