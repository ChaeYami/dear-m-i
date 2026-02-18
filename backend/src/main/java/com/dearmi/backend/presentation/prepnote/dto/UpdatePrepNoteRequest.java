package com.dearmi.backend.presentation.prepnote.dto;

import com.dearmi.backend.domain.prepnote.PrepNoteSections;
import jakarta.validation.constraints.Size;

public record UpdatePrepNoteRequest(
        @Size(max = 2000, message = "내용은 2000자 이하여야 합니다.")
        String content,
        PrepNoteSections sections
) {}
