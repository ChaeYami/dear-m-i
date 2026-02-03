package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.checkin.DailyCheckin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DailyCheckinJpaRepository extends JpaRepository<DailyCheckin, UUID> {

    Optional<DailyCheckin> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    Optional<DailyCheckin> findByUserIdAndCheckedAt(UUID userId, LocalDate checkedAt);

    List<DailyCheckin> findByUserIdAndDeletedAtIsNullAndCheckedAtAfterOrderByCheckedAtDesc(UUID userId, LocalDate after);

    boolean existsByUserIdAndCheckedAt(UUID userId, LocalDate checkedAt);

    List<DailyCheckin> findByUserIdAndCheckedAtBetweenOrderByCheckedAtDesc(
            UUID userId, LocalDate startDate, LocalDate endDate);
}
