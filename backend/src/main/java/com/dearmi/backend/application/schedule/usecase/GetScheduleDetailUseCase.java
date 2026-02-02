package com.dearmi.backend.application.schedule.usecase;

import com.dearmi.backend.application.schedule.dto.ScheduleResult;

import java.util.UUID;

public interface GetScheduleDetailUseCase {
    ScheduleResult getDetail(UUID userId, UUID scheduleId);
}
