package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.checkin.DailyCheckin;
import com.dearmi.backend.domain.checkin.DailyCheckinRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class DailyCheckinRepositoryImpl implements DailyCheckinRepository {

    private final DailyCheckinJpaRepository jpa;

    @Override
    public DailyCheckin save(DailyCheckin checkin) {
        return jpa.save(checkin);
    }

    @Override
    public Optional<DailyCheckin> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId) {
        return jpa.findByIdAndUserIdAndDeletedAtIsNull(id, userId);
    }

    @Override
    public Optional<DailyCheckin> findByUserIdAndCheckedAt(UUID userId, LocalDate checkedAt) {
        return jpa.findByUserIdAndCheckedAt(userId, checkedAt);
    }

    @Override
    public List<DailyCheckin> findByUserIdAndDeletedAtIsNullAndCheckedAtAfterOrderByCheckedAtDesc(UUID userId, LocalDate after) {
        return jpa.findByUserIdAndDeletedAtIsNullAndCheckedAtAfterOrderByCheckedAtDesc(userId, after);
    }

    @Override
    public boolean existsByUserIdAndCheckedAt(UUID userId, LocalDate checkedAt) {
        return jpa.existsByUserIdAndCheckedAt(userId, checkedAt);
    }
}
