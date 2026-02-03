package com.dearmi.backend.application.prepnote.dto;

import java.util.UUID;

public record CreatePrepNoteCommand(
        UUID userId,
        UUID scheduleId,   // nullable
        String content
) {}
