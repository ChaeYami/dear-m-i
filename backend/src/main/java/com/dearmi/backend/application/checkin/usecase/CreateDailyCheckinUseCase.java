package com.dearmi.backend.application.checkin.usecase;

import com.dearmi.backend.application.checkin.dto.CheckinResult;
import com.dearmi.backend.application.checkin.dto.CreateCheckinCommand;

public interface CreateDailyCheckinUseCase {

    CheckinResult createOrUpdate(CreateCheckinCommand command);
}
