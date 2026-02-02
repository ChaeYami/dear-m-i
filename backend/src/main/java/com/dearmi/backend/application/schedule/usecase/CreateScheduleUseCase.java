package com.dearmi.backend.application.schedule.usecase;

import com.dearmi.backend.application.schedule.dto.CreateScheduleCommand;
import com.dearmi.backend.application.schedule.dto.ScheduleResult;

public interface CreateScheduleUseCase {
    ScheduleResult create(CreateScheduleCommand command);
}
