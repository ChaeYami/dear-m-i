package com.dearmi.backend.application.prepnote.dto;

import com.dearmi.backend.domain.prepnote.PrepNote;

import java.time.LocalDateTime;
import java.util.UUID;

public record PrepNoteResult(
        UUID id,
        UUID userId,
        UUID scheduleId,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static PrepNoteResult from(PrepNote note) {
        return new PrepNoteResult(
                note.getId(),
                note.getUserId(),
                note.getScheduleId(),
                note.getContent(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }
}
