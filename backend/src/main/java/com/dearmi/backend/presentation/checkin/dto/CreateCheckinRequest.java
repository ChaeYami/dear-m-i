package com.dearmi.backend.presentation.checkin.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CreateCheckinRequest(
        @NotNull @Min(1) @Max(10) Short emotionScore,
        List<String> triggerTags,
        String memo,
        @DecimalMin("0.0") @DecimalMax("24.0") BigDecimal sleepHours,
        Boolean tookMedication,
        /** 기록 날짜 (YYYY-MM-DD). null이면 오늘 */
        LocalDate checkedAt
) {}
