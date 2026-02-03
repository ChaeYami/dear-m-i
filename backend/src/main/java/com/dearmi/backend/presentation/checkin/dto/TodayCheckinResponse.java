package com.dearmi.backend.presentation.checkin.dto;

import com.dearmi.backend.application.checkin.dto.CheckinResult;

public record TodayCheckinResponse(
        boolean checkedIn,
        CheckinResponse checkin
) {
    public static TodayCheckinResponse of(CheckinResult result) {
        return new TodayCheckinResponse(true, CheckinResponse.from(result));
    }

    public static TodayCheckinResponse notCheckedIn() {
        return new TodayCheckinResponse(false, null);
    }
}
