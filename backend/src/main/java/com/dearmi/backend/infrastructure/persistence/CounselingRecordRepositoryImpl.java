package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.counseling.CounselingRecord;
import com.dearmi.backend.domain.counseling.CounselingRecordRepository;
import com.dearmi.backend.domain.counseling.QCounselingRecord;
import com.querydsl.jpa.impl.JPAQueryFactory;
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
    private final JPAQueryFactory queryFactory;

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
    public List<CounselingRecord> findByUserIdOrderByCreatedAtDesc(UUID userId, int offset, int limit) {
        QCounselingRecord cr = QCounselingRecord.counselingRecord;
        return queryFactory
                .selectFrom(cr)
                .where(cr.userId.eq(userId), cr.deletedAt.isNull())
                .orderBy(cr.createdAt.desc())
                .offset(offset)
                .limit(limit)
                .fetch();
    }

    @Override
    public long countByUserIdAndDeletedAtIsNull(UUID userId) {
        QCounselingRecord cr = QCounselingRecord.counselingRecord;
        Long count = queryFactory
                .select(cr.count())
                .from(cr)
                .where(cr.userId.eq(userId), cr.deletedAt.isNull())
                .fetchOne();
        return count != null ? count : 0L;
    }

    @Override
    public List<CounselingRecord> findByUserIdAndDeletedAtIsNullAndCreatedAtAfterOrderByCreatedAtDesc(
            UUID userId, LocalDateTime after, int offset, int limit) {
        QCounselingRecord cr = QCounselingRecord.counselingRecord;
        return queryFactory
                .selectFrom(cr)
                .where(cr.userId.eq(userId), cr.deletedAt.isNull(), cr.createdAt.after(after))
                .orderBy(cr.createdAt.desc())
                .offset(offset)
                .limit(limit)
                .fetch();
    }

    @Override
    public long countByUserIdAndDeletedAtIsNullAndCreatedAtAfter(UUID userId, LocalDateTime after) {
        QCounselingRecord cr = QCounselingRecord.counselingRecord;
        Long count = queryFactory
                .select(cr.count())
                .from(cr)
                .where(cr.userId.eq(userId), cr.deletedAt.isNull(), cr.createdAt.after(after))
                .fetchOne();
        return count != null ? count : 0L;
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
