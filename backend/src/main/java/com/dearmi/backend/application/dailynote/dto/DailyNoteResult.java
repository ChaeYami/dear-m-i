package com.dearmi.backend.application.dailynote.dto;

import com.dearmi.backend.domain.dailynote.DailyNote;
import com.dearmi.backend.domain.dailynote.NoteType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record DailyNoteResult(
        UUID id,
        UUID userId,
        String body,
        NoteType noteType,
        LocalDate noteDate,
        UUID usedInPrepNoteId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static DailyNoteResult from(DailyNote note) {
        return new DailyNoteResult(
                note.getId(),
                note.getUserId(),
                note.getBody(),
                note.getNoteType(),
                note.getNoteDate(),
                note.getUsedInPrepNoteId(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }
}
