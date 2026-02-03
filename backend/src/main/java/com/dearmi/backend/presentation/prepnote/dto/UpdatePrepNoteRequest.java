package com.dearmi.backend.presentation.prepnote.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdatePrepNoteRequest(
        @NotBlank(message = "내용을 입력해주세요.")
        @Size(max = 2000, message = "내용은 2000자 이하여야 합니다.")
        String content
) {}
