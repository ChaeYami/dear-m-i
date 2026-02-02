package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.auth.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenJpaRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByUserId(UUID userId);

    /** 탈퇴 시 즉시 삭제 (⑥ 원칙) */
    void deleteByUserId(UUID userId);
}
