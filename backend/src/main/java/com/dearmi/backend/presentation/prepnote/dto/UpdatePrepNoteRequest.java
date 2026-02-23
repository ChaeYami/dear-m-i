package com.dearmi.backend.presentation.prepnote.dto;

import com.dearmi.backend.domain.prepnote.PrepNoteSections;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record UpdatePrepNoteRequest(
        @Size(max = 2000, message = "내용은 2000자 이하여야 합니다.")
        String content,
        PrepNoteSections sections,
        List<UUID> linkedNoteIds  // nullable — null이면 기존 유지
) {}
