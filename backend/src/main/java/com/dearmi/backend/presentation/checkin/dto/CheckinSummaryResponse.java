package com.dearmi.backend.presentation.checkin.dto;

import com.dearmi.backend.application.checkin.dto.CheckinSummaryResult;

import java.math.BigDecimal;
import java.util.List;

public record CheckinSummaryResponse(
        BigDecimal averageEmotionScore,
        BigDecimal averageSleepHours,
        Integer medicationRate,
        List<String> topTriggerTags,
        int totalCheckins
) {
    public static CheckinSummaryResponse from(CheckinSummaryResult r) {
        return new CheckinSummaryResponse(
                r.averageEmotionScore(), r.averageSleepHours(),
                r.medicationRate(), r.topTriggerTags(), r.totalCheckins()
        );
    }
}
