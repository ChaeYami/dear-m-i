package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.counseling.CounselingRecord;
import com.dearmi.backend.domain.counseling.CounselingRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class CounselingRecordRepositoryImpl implements CounselingRecordRepository {

    private final CounselingRecordJpaRepository jpa;

    @Override
    public CounselingRecord save(CounselingRecord record) {
        return jpa.save(record);
    }

    @Override
    public Optional<CounselingRecord> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId) {
        return jpa.findByIdAndUserIdAndDeletedAtIsNull(id, userId);
    }

    @Override
    public List<CounselingRecord> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID userId) {
        return jpa.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId);
    }

    @Override
    public List<CounselingRecord> findByUserIdAndDeletedAtIsNullAndCreatedAtAfterOrderByCreatedAtDesc(
            UUID userId, LocalDateTime after) {
        return jpa.findByUserIdAndDeletedAtIsNullAndCreatedAtAfterOrderByCreatedAtDesc(userId, after);
    }

    @Override
    public void detachSchedule(UUID scheduleId) {
        jpa.detachSchedule(scheduleId);
    }

    @Override
    public boolean existsByScheduleIdAndDeletedAtIsNull(UUID scheduleId) {
        return jpa.existsByScheduleIdAndDeletedAtIsNull(scheduleId);
    }

    @Override
    public Set<UUID> findScheduleIdsHavingRecords(UUID userId, List<UUID> scheduleIds) {
        if (scheduleIds.isEmpty()) {
            return Set.of();
        }
        return new HashSet<>(jpa.findScheduleIdsHavingRecords(userId, scheduleIds));
    }
}
