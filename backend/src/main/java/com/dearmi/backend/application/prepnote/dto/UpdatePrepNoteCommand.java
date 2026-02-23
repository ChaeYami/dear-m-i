package com.dearmi.backend.application.prepnote.dto;

import com.dearmi.backend.domain.prepnote.PrepNoteSections;

import java.util.List;
import java.util.UUID;

public record UpdatePrepNoteCommand(
        UUID userId,
        UUID prepNoteId,
        String content,
        PrepNoteSections sections,
        List<UUID> linkedNoteIds  // 선택된 DailyNote ID 목록 (nullable — null이면 변경 안 함)
) {}
