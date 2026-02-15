package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.checkin.DailyCheckin;
import com.dearmi.backend.domain.checkin.DailyCheckinRepository;
import com.dearmi.backend.domain.checkin.QDailyCheckin;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class DailyCheckinRepositoryImpl implements DailyCheckinRepository {

    private final DailyCheckinJpaRepository jpa;
    private final JPAQueryFactory queryFactory;

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

    @Override
    public List<DailyCheckin> findByUserIdAndCheckedAtBetweenOrderByCheckedAtDesc(
            UUID userId, LocalDate startDate, LocalDate endDate) {
        return jpa.findByUserIdAndCheckedAtBetweenOrderByCheckedAtDesc(userId, startDate, endDate);
    }

    @Override
    public List<DailyCheckin> searchByKeyword(UUID userId, String keyword, LocalDate fromDate, int offset, int limit) {
        QDailyCheckin qc = QDailyCheckin.dailyCheckin;
        return queryFactory
                .selectFrom(qc)
                .where(buildWhere(qc, userId, keyword, fromDate))
                .orderBy(qc.checkedAt.desc())
                .offset(offset)
                .limit(limit)
                .fetch();
    }

    @Override
    public long countByKeyword(UUID userId, String keyword, LocalDate fromDate) {
        QDailyCheckin qc = QDailyCheckin.dailyCheckin;
        Long count = queryFactory
                .select(qc.count())
                .from(qc)
                .where(buildWhere(qc, userId, keyword, fromDate))
                .fetchOne();
        return count != null ? count : 0L;
    }

    @Override
    public List<DailyCheckin> searchByKeywordAndTags(UUID userId, String keyword, List<String> tags, LocalDate fromDate, int offset, int limit) {
        QDailyCheckin qc = QDailyCheckin.dailyCheckin;
        return queryFactory
                .selectFrom(qc)
                .where(buildWhere(qc, userId, keyword, tags, fromDate))
                .orderBy(qc.checkedAt.desc())
                .offset(offset)
                .limit(limit)
                .fetch();
    }

    @Override
    public long countByKeywordAndTags(UUID userId, String keyword, List<String> tags, LocalDate fromDate) {
        QDailyCheckin qc = QDailyCheckin.dailyCheckin;
        Long count = queryFactory
                .select(qc.count())
                .from(qc)
                .where(buildWhere(qc, userId, keyword, tags, fromDate))
                .fetchOne();
        return count != null ? count : 0L;
    }

    private BooleanBuilder buildWhere(QDailyCheckin qc, UUID userId, String keyword, LocalDate fromDate) {
        return buildWhere(qc, userId, keyword, null, fromDate);
    }

    private BooleanBuilder buildWhere(QDailyCheckin qc, UUID userId, String keyword, List<String> tags, LocalDate fromDate) {
        BooleanBuilder where = new BooleanBuilder()
                .and(qc.userId.eq(userId))
                .and(qc.deletedAt.isNull());
        if (fromDate != null) {
            where.and(qc.checkedAt.goe(fromDate));
        }
        if (StringUtils.hasText(keyword)) {
            where.and(qc.memo.containsIgnoreCase(keyword));
        }
        if (tags != null && !tags.isEmpty()) {
            // trigger_tags 는 JSON 배열 문자열로 저장됨 (예: ["가족","직장"])
            // DB 컬럼의 문자열에 대해 LIKE 검색
            StringPath rawTags = Expressions.stringPath(qc, "triggerTags");
            BooleanBuilder tagCondition = new BooleanBuilder();
            for (String tag : tags) {
                tagCondition.or(rawTags.containsIgnoreCase(tag));
            }
            where.and(tagCondition);
        }
        return where;
    }
}
