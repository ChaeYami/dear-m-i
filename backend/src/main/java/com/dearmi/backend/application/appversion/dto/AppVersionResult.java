package com.dearmi.backend.application.appversion.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AppVersionResult {
    private final boolean forceUpdate;
    private final String latestVersion;
    private final String updateMessage;
    private final String storeUrl;
}
