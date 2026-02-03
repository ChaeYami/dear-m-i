package com.dearmi.backend.application.checkin.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CreateCheckinCommand(
        UUID userId,
        Short emotionScore,
        List<String> triggerTags,
        String memo,
        BigDecimal sleepHours,
        Boolean tookMedication
) {}
