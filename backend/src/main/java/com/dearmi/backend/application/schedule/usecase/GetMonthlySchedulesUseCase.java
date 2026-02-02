package com.dearmi.backend.application.schedule.usecase;

import com.dearmi.backend.application.schedule.dto.ScheduleResult;

import java.util.List;
import java.util.UUID;

public interface GetMonthlySchedulesUseCase {
    List<ScheduleResult> getMonthly(UUID userId, int year, int month);
}
