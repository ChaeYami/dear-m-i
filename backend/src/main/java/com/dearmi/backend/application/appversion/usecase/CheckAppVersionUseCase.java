package com.dearmi.backend.application.appversion.usecase;

import com.dearmi.backend.application.appversion.dto.AppVersionResult;

public interface CheckAppVersionUseCase {
    AppVersionResult check(String platform, String currentVersion);
}
