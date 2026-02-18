package com.dearmi.backend.presentation.prepnote.dto;

import com.dearmi.backend.application.prepnote.dto.PrepNoteResult;
import com.dearmi.backend.domain.prepnote.PrepNoteSections;

import java.time.LocalDateTime;
import java.util.UUID;

public record PrepNoteResponse(
        UUID id,
        UUID scheduleId,
        String content,
        PrepNoteSections sections,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static PrepNoteResponse from(PrepNoteResult result) {
        return new PrepNoteResponse(
                result.id(),
                result.scheduleId(),
                result.content(),
                result.sections(),
                result.createdAt(),
                result.updatedAt()
        );
    }
}
