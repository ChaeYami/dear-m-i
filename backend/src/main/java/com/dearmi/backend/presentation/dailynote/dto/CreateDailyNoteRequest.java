package com.dearmi.backend.presentation.dailynote.dto;

import com.dearmi.backend.domain.dailynote.NoteType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateDailyNoteRequest(
        @NotBlank
        @Size(max = 300, message = "메모는 300자 이하여야 합니다.")
        String body,

        NoteType noteType,

        /** 기록 날짜 (YYYY-MM-DD). 생략 시 오늘 */
        LocalDate noteDate
) {}
