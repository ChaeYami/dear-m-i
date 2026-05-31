package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.schedule.HospitalSchedule;
import com.dearmi.backend.domain.schedule.HospitalScheduleRepository;
import com.dearmi.backend.domain.schedule.QHospitalSchedule;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class HospitalScheduleRepositoryImpl implements HospitalScheduleRepository {

    private final HospitalScheduleJpaRepository jpa;
    private final JPAQueryFactory queryFactory;

    @Override
    public HospitalSchedule save(HospitalSchedule schedule) {
        return jpa.save(schedule);
    }

    @Override
    public Optional<HospitalSchedule> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId) {
        return jpa.findByIdAndUserIdAndDeletedAtIsNull(id, userId);
    }

    @Override
    public List<HospitalSchedule> findByUserIdAndDeletedAtIsNullOrderByScheduledAtDesc(UUID userId) {
        return jpa.findByUserIdAndDeletedAtIsNullOrderByScheduledAtDesc(userId);
    }

    /**
     * QueryDSL로 월별 일정 조회
     * - scheduledAt BETWEEN 월초(inclusive) AND 다음 달 초(exclusive)
     * - deleted_at IS NULL 항상 포함
     * - 본인 userId만
     */
    @Override
    public List<HospitalSchedule> findByUserIdAndMonth(UUID userId, int year, int month) {
        QHospitalSchedule hs = QHospitalSchedule.hospitalSchedule;

        LocalDateTime from = LocalDate.of(year, month, 1).atStartOfDay();
        LocalDateTime to   = from.plusMonths(1);

        return queryFactory
                .selectFrom(hs)
                .where(
                        hs.userId.eq(userId),
                        hs.deletedAt.isNull(),
                        hs.scheduledAt.goe(from),
                        hs.scheduledAt.lt(to)
                )
                .orderBy(hs.scheduledAt.asc())
                .fetch();
    }

    @Override
    public List<HospitalSchedule> findPastByUserId(UUID userId, LocalDateTime now, int limit) {
        QHospitalSchedule hs = QHospitalSchedule.hospitalSchedule;
        return queryFactory
                .selectFrom(hs)
                .where(
                        hs.userId.eq(userId),
                        hs.deletedAt.isNull(),
                        hs.scheduledAt.lt(now)
                )
                .orderBy(hs.scheduledAt.desc())
                .limit(limit)
                .fetch();
    }

    @Override
    public List<HospitalSchedule> findFutureByUserId(UUID userId, LocalDateTime now, int limit) {
        QHospitalSchedule hs = QHospitalSchedule.hospitalSchedule;
        return queryFactory
                .selectFrom(hs)
                .where(
                        hs.userId.eq(userId),
                        hs.deletedAt.isNull(),
                        hs.scheduledAt.goe(now)
                )
                .orderBy(hs.scheduledAt.asc())
                .limit(limit)
                .fetch();
    }

    @Override
    public void delete(HospitalSchedule schedule) {
        jpa.delete(schedule);
    }

    @Override
    public List<HospitalSchedule> findByScheduledAtBetweenAndDeletedAtIsNull(LocalDateTime from, LocalDateTime to) {
        return jpa.findByScheduledAtBetweenAndDeletedAtIsNull(from, to);
    }
}
