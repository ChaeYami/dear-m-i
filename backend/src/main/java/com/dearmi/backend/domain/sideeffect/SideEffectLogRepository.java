package com.dearmi.backend.domain.sideeffect;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SideEffectLogRepository {

    SideEffectLog save(SideEffectLog log);

    Optional<SideEffectLog> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    /** 유저별 최신순 페이지 조회. */
    List<SideEffectLog> findPageByUserId(UUID userId, int offset, int size);

    long countByUserId(UUID userId);

    /** 특정 시점 이후의 로그 — prep note 자동 첨부용. */
    List<SideEffectLog> findByUserIdSince(UUID userId, LocalDateTime since);
}
