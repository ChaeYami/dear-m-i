package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.sideeffect.SideEffectLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SideEffectLogJpaRepository extends JpaRepository<SideEffectLog, UUID> {

    Optional<SideEffectLog> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    @Query(value = "SELECT * FROM side_effect_logs " +
                   "WHERE user_id = :userId AND deleted_at IS NULL " +
                   "ORDER BY occurred_at DESC " +
                   "OFFSET :offset LIMIT :size",
            nativeQuery = true)
    List<SideEffectLog> findPageByUserId(@Param("userId") UUID userId,
                                         @Param("offset") int offset,
                                         @Param("size") int size);

    @Query("SELECT COUNT(s) FROM SideEffectLog s " +
           "WHERE s.userId = :userId AND s.deletedAt IS NULL")
    long countByUserId(@Param("userId") UUID userId);

    @Query("SELECT s FROM SideEffectLog s " +
           "WHERE s.userId = :userId AND s.deletedAt IS NULL AND s.occurredAt >= :since " +
           "ORDER BY s.occurredAt DESC")
    List<SideEffectLog> findByUserIdSince(@Param("userId") UUID userId,
                                          @Param("since") LocalDateTime since);
}
