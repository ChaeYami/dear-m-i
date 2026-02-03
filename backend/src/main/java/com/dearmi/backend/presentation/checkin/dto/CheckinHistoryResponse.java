package com.dearmi.backend.presentation.checkin.dto;

import com.dearmi.backend.application.checkin.dto.CheckinHistoryResult;

import java.util.List;

public record CheckinHistoryResponse(
        List<CheckinResponse> content,
        boolean isLimited
) {
    public static CheckinHistoryResponse from(CheckinHistoryResult result) {
        return new CheckinHistoryResponse(
                result.content().stream().map(CheckinResponse::from).toList(),
                result.isLimited()
        );
    }
}
