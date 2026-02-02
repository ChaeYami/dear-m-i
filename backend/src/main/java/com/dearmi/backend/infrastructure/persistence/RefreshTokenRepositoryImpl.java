package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.auth.RefreshToken;
import com.dearmi.backend.domain.auth.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class RefreshTokenRepositoryImpl implements RefreshTokenRepository {

    private final RefreshTokenJpaRepository jpa;

    @Override
    public RefreshToken save(RefreshToken refreshToken) {
        return jpa.save(refreshToken);
    }

    @Override
    public Optional<RefreshToken> findByUserId(UUID userId) {
        return jpa.findByUserId(userId);
    }

    @Override
    public void deleteByUserId(UUID userId) {
        jpa.deleteByUserId(userId);
    }
}
