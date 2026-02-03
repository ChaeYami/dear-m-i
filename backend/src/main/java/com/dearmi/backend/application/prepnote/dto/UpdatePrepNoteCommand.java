package com.dearmi.backend.application.prepnote.dto;

import java.util.UUID;

public record UpdatePrepNoteCommand(
        UUID userId,
        UUID prepNoteId,
        String content
) {}
