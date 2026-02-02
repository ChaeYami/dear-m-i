package com.dearmi.backend.application.schedule.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record UpdateScheduleCommand(
        UUID userId,
        UUID scheduleId,
        String hospitalName,
        LocalDateTime scheduledAt,
        String memo
) {}
