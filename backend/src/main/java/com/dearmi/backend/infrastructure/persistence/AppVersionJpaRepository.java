package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.appversion.AppVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface AppVersionJpaRepository extends JpaRepository<AppVersion, UUID> {

    /** SplashScreen 버전 체크: platform 기준 가장 최근 레코드 (③ 원칙) */
    Optional<AppVersion> findFirstByPlatformOrderByCreatedAtDesc(String platform);
}
