package com.dearmi.backend.application.checkin.usecase;

import com.dearmi.backend.application.checkin.dto.CheckinSummaryResult;

import java.util.UUID;

public interface GetCheckinSummaryUseCase {

    CheckinSummaryResult getSummary(UUID userId);
}
