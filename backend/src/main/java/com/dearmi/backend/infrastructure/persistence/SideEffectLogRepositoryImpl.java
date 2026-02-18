package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.sideeffect.SideEffectLog;
import com.dearmi.backend.domain.sideeffect.SideEffectLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class SideEffectLogRepositoryImpl implements SideEffectLogRepository {

    private final SideEffectLogJpaRepository jpa;

    @Override
    public SideEffectLog save(SideEffectLog log) {
        return jpa.save(log);
    }

    @Override
    public Optional<SideEffectLog> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId) {
        return jpa.findByIdAndUserIdAndDeletedAtIsNull(id, userId);
    }

    @Override
    public List<SideEffectLog> findPageByUserId(UUID userId, int offset, int size) {
        return jpa.findPageByUserId(userId, offset, size);
    }

    @Override
    public long countByUserId(UUID userId) {
        return jpa.countByUserId(userId);
    }

    @Override
    public List<SideEffectLog> findByUserIdSince(UUID userId, LocalDateTime since) {
        return jpa.findByUserIdSince(userId, since);
    }
}
