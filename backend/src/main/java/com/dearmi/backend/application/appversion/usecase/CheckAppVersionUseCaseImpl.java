package com.dearmi.backend.application.appversion.usecase;

import com.dearmi.backend.application.appversion.dto.AppVersionResult;
import com.dearmi.backend.domain.appversion.AppVersion;
import com.dearmi.backend.domain.appversion.AppVersionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CheckAppVersionUseCaseImpl implements CheckAppVersionUseCase {

    private static final String IOS_STORE_URL = "https://apps.apple.com/app/dearmi/id0000000000";
    private static final String ANDROID_STORE_URL = "https://play.google.com/store/apps/details?id=com.dearmi.app";

    private final AppVersionRepository appVersionRepository;

    @Override
    public AppVersionResult check(String platform, String currentVersion) {
        var appVersion = appVersionRepository
                .findFirstByPlatformOrderByCreatedAtDesc(platform.toLowerCase())
                .orElse(null);

        // DB에 버전 정보가 없으면 업데이트 불필요로 응답
        if (appVersion == null) {
            return AppVersionResult.builder()
                    .forceUpdate(false)
                    .latestVersion(currentVersion)
                    .updateMessage("")
                    .storeUrl(resolveStoreUrl(platform))
                    .build();
        }

        boolean needsForceUpdate = appVersion.getForceUpdate()
                && compareVersions(currentVersion, appVersion.getMinVersion()) < 0;

        return AppVersionResult.builder()
                .forceUpdate(needsForceUpdate)
                .latestVersion(appVersion.getLatestVersion())
                .updateMessage(appVersion.getUpdateMessageKo() != null
                        ? appVersion.getUpdateMessageKo() : "")
                .storeUrl(resolveStoreUrl(platform))
                .build();
    }

    private String resolveStoreUrl(String platform) {
        return "ios".equalsIgnoreCase(platform) ? IOS_STORE_URL : ANDROID_STORE_URL;
    }

    /**
     * 시맨틱 버전 비교: "1.2.3" vs "1.3.0"
     * @return 음수(current < min), 0(같음), 양수(current > min)
     */
    private int compareVersions(String current, String min) {
        String[] c = current.split("\\.");
        String[] m = min.split("\\.");
        int len = Math.max(c.length, m.length);
        for (int i = 0; i < len; i++) {
            int cv = i < c.length ? parseIntSafe(c[i]) : 0;
            int mv = i < m.length ? parseIntSafe(m[i]) : 0;
            if (cv != mv) return cv - mv;
        }
        return 0;
    }

    private int parseIntSafe(String s) {
        try { return Integer.parseInt(s); }
        catch (NumberFormatException e) { return 0; }
    }
}
