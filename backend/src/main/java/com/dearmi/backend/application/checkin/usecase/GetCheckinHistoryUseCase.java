package com.dearmi.backend.application.checkin.usecase;

import com.dearmi.backend.application.checkin.dto.CheckinHistoryResult;

import java.time.LocalDate;
import java.util.UUID;

public interface GetCheckinHistoryUseCase {

    CheckinHistoryResult getHistory(UUID userId, LocalDate startDate, LocalDate endDate);
}
