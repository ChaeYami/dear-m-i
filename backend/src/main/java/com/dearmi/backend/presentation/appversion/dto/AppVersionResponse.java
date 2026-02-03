package com.dearmi.backend.presentation.appversion.dto;

import com.dearmi.backend.application.appversion.dto.AppVersionResult;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AppVersionResponse {
    private final boolean forceUpdate;
    private final String latestVersion;
    private final String updateMessage;
    private final String storeUrl;

    public static AppVersionResponse from(AppVersionResult result) {
        return AppVersionResponse.builder()
                .forceUpdate(result.isForceUpdate())
                .latestVersion(result.getLatestVersion())
                .updateMessage(result.getUpdateMessage())
                .storeUrl(result.getStoreUrl())
                .build();
    }
}
