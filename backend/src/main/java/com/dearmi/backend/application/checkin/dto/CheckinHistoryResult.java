package com.dearmi.backend.application.checkin.dto;

import java.util.List;

public record CheckinHistoryResult(
        List<CheckinResult> content,
        boolean isLimited
) {}
