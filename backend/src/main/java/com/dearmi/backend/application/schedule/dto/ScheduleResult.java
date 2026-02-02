package com.dearmi.backend.application.schedule.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ScheduleResult(
        UUID id,
        String hospitalName,
        LocalDateTime scheduledAt,
        String memo,
        String status,
        boolean hasCounselingRecord
) {}
