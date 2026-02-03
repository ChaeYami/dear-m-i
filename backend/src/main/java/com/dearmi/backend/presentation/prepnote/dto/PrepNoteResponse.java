package com.dearmi.backend.presentation.prepnote.dto;

import com.dearmi.backend.application.prepnote.dto.PrepNoteResult;

import java.time.LocalDateTime;
import java.util.UUID;

public record PrepNoteResponse(
        UUID id,
        UUID scheduleId,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static PrepNoteResponse from(PrepNoteResult result) {
        return new PrepNoteResponse(
                result.id(),
                result.scheduleId(),
                result.content(),
                result.createdAt(),
                result.updatedAt()
        );
    }
}
