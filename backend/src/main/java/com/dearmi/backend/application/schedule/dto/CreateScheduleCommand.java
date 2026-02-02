package com.dearmi.backend.application.schedule.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record CreateScheduleCommand(
        UUID userId,
        String hospitalName,
        LocalDateTime scheduledAt,
        String memo
) {}
