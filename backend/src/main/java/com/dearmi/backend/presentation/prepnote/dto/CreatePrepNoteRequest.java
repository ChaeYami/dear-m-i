package com.dearmi.backend.presentation.prepnote.dto;

import com.dearmi.backend.domain.prepnote.PrepNoteSections;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreatePrepNoteRequest(
        UUID scheduleId,   // nullable — 일정 없이도 작성 가능

        @Size(max = 2000, message = "내용은 2000자 이하여야 합니다.")
        String content,    // nullable — sections 만 채워서 보내도 됨

        PrepNoteSections sections // nullable — 비면 빈 객체로 저장
) {}
