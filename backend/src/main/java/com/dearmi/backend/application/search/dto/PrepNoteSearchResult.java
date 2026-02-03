package com.dearmi.backend.application.search.dto;

import com.dearmi.backend.domain.prepnote.PrepNote;

import java.time.LocalDateTime;
import java.util.UUID;

public record PrepNoteSearchResult(
        UUID id,
        UUID scheduleId,
        String content,
        LocalDateTime createdAt
) {
    public static PrepNoteSearchResult from(PrepNote note) {
        return new PrepNoteSearchResult(
                note.getId(),
                note.getScheduleId(),
                note.getContent(),
                note.getCreatedAt()
        );
    }
}
