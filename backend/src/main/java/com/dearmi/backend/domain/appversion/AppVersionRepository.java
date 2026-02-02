package com.dearmi.backend.domain.appversion;

import java.util.Optional;

public interface AppVersionRepository {

    AppVersion save(AppVersion appVersion);

    /** SplashScreen 버전 체크 API용 (③ 원칙) — platform 기준 가장 최근 레코드 */
    Optional<AppVersion> findFirstByPlatformOrderByCreatedAtDesc(String platform);
}
