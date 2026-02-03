package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.appversion.AppVersion;
import com.dearmi.backend.domain.appversion.AppVersionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class AppVersionRepositoryImpl implements AppVersionRepository {

    private final AppVersionJpaRepository jpa;

    @Override
    public AppVersion save(AppVersion appVersion) {
        return jpa.save(appVersion);
    }

    @Override
    public Optional<AppVersion> findFirstByPlatformOrderByCreatedAtDesc(String platform) {
        return jpa.findFirstByPlatformOrderByCreatedAtDesc(platform);
    }
}
