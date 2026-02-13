package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.counseling.CounselingRecord;
import com.dearmi.backend.domain.counseling.CounselingRecordRepository;
import com.dearmi.backend.domain.counseling.QCounselingRecord;
import com.dearmi.backend.domain.hospital.QHospitalSchedule;
import com.querydsl.core.types.dsl.DateTemplate;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
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
        QHospitalSchedule hs = QHospitalSchedule.hospitalSchedule;
        // 정렬 기준: consultedAt(직접 기록) 이 있으면 그것, 없으면 연결 일정의 scheduledAt 날짜.
        // 둘 다 없으면 NULL → 뒤로. 동률은 createdAt 내림차순.
        DateTemplate<LocalDate> effectiveDate = Expressions.dateTemplate(
                LocalDate.class,
                "coalesce({0}, cast({1} as date))",
                cr.consultedAt, hs.scheduledAt);
        return queryFactory
                .selectFrom(cr)
                .leftJoin(hs).on(hs.id.eq(cr.scheduleId))
                .where(cr.userId.eq(userId), cr.deletedAt.isNull())
                .orderBy(effectiveDate.desc().nullsLast(), cr.createdAt.desc())
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
        QHospitalSchedule hs = QHospitalSchedule.hospitalSchedule;
        // 정렬 기준: consultedAt 우선, 없으면 연결 일정의 scheduledAt 날짜. 둘 다 없으면 NULL 뒤로.
        // FREE 플랜 2개월 cutoff 는 createdAt 기준 유지 (진료일 임의 입력 가능해 일관성 위해).
        DateTemplate<LocalDate> effectiveDate = Expressions.dateTemplate(
                LocalDate.class,
                "coalesce({0}, cast({1} as date))",
                cr.consultedAt, hs.scheduledAt);
        return queryFactory
                .selectFrom(cr)
                .leftJoin(hs).on(hs.id.eq(cr.scheduleId))
                .where(cr.userId.eq(userId), cr.deletedAt.isNull(), cr.createdAt.after(after))
                .orderBy(effectiveDate.desc().nullsLast(), cr.createdAt.desc())
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
