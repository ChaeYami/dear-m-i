package com.dearmi.backend.application.prepnote.dto;

import com.dearmi.backend.domain.prepnote.PrepNoteSections;

import java.util.UUID;

public record UpdatePrepNoteCommand(
        UUID userId,
        UUID prepNoteId,
        String content,
        PrepNoteSections sections
) {}
