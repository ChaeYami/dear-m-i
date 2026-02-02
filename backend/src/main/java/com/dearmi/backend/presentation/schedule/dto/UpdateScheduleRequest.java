package com.dearmi.backend.presentation.schedule.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record UpdateScheduleRequest(
        @NotBlank(message = "병원명은 필수입니다.")
        String hospitalName,

        @NotNull(message = "일정 시각은 필수입니다.")
        LocalDateTime scheduledAt,

        String memo
) {}
