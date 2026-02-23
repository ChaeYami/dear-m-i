package com.dearmi.backend.application.dailynote.dto;

import com.dearmi.backend.domain.dailynote.NoteType;

import java.time.LocalDate;
import java.util.UUID;

public record CreateDailyNoteCommand(
        UUID userId,
        String body,
        NoteType noteType,
        /** 기록 날짜 — null이면 오늘 */
        LocalDate noteDate
) {}
