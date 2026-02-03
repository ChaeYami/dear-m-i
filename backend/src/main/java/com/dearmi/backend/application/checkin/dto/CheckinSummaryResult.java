package com.dearmi.backend.application.checkin.dto;

import java.math.BigDecimal;
import java.util.List;

public record CheckinSummaryResult(
        BigDecimal averageEmotionScore,
        BigDecimal averageSleepHours,
        Integer medicationRate,
        List<String> topTriggerTags,
        int totalCheckins
) {}
