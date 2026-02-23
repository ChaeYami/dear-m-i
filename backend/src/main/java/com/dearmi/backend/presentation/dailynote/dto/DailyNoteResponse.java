package com.dearmi.backend.presentation.dailynote.dto;

import com.dearmi.backend.application.dailynote.dto.DailyNoteResult;
import com.dearmi.backend.domain.dailynote.NoteType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record DailyNoteResponse(
        UUID id,
        String body,
        NoteType noteType,
        LocalDate noteDate,
        UUID usedInPrepNoteId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static DailyNoteResponse from(DailyNoteResult result) {
        return new DailyNoteResponse(
                result.id(),
                result.body(),
                result.noteType(),
                result.noteDate(),
                result.usedInPrepNoteId(),
                result.createdAt(),
                result.updatedAt()
        );
    }
}
