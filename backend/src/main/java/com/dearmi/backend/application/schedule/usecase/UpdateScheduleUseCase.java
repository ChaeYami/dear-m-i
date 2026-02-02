package com.dearmi.backend.application.schedule.usecase;

import com.dearmi.backend.application.schedule.dto.ScheduleResult;
import com.dearmi.backend.application.schedule.dto.UpdateScheduleCommand;

public interface UpdateScheduleUseCase {
    ScheduleResult update(UpdateScheduleCommand command);
}
