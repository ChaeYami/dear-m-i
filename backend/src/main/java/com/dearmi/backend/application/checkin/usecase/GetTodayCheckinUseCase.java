package com.dearmi.backend.application.checkin.usecase;

import com.dearmi.backend.application.checkin.dto.CheckinResult;

import java.util.Optional;
import java.util.UUID;

public interface GetTodayCheckinUseCase {

    Optional<CheckinResult> getToday(UUID userId);
}
