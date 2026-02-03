package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.prepnote.PrepNote;
import com.dearmi.backend.domain.prepnote.PrepNoteRepository;
import com.dearmi.backend.domain.prepnote.QPrepNote;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class PrepNoteRepositoryImpl implements PrepNoteRepository {

    private final PrepNoteJpaRepository jpa;
    private final JPAQueryFactory queryFactory;

    @Override
    public PrepNote save(PrepNote prepNote) {
        return jpa.save(prepNote);
    }

    @Override
    public Optional<PrepNote> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId) {
        return jpa.findByIdAndUserIdAndDeletedAtIsNull(id, userId);
    }

    @Override
    public List<PrepNote> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID userId) {
        return jpa.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId);
    }

    @Override
    public List<PrepNote> findByUserIdAndScheduleIdAndDeletedAtIsNull(UUID userId, UUID scheduleId) {
        return jpa.findByUserIdAndScheduleIdAndDeletedAtIsNull(userId, scheduleId);
    }

    @Override
    public boolean existsByScheduleIdAndDeletedAtIsNull(UUID scheduleId) {
        return jpa.existsByScheduleIdAndDeletedAtIsNull(scheduleId);
    }

    @Override
    public List<PrepNote> searchByKeyword(UUID userId, String keyword, LocalDateTime from, int offset, int limit) {
        QPrepNote qn = QPrepNote.prepNote;
        return queryFactory
                .selectFrom(qn)
                .where(buildWhere(qn, userId, keyword, from))
                .orderBy(qn.createdAt.desc())
                .offset(offset)
                .limit(limit)
                .fetch();
    }

    @Override
    public long countByKeyword(UUID userId, String keyword, LocalDateTime from) {
        QPrepNote qn = QPrepNote.prepNote;
        Long count = queryFactory
                .select(qn.count())
                .from(qn)
                .where(buildWhere(qn, userId, keyword, from))
                .fetchOne();
        return count != null ? count : 0L;
    }

    @Override
    public void detachSchedule(UUID scheduleId) {
        jpa.detachSchedule(scheduleId);
    }

    private BooleanBuilder buildWhere(QPrepNote qn, UUID userId, String keyword, LocalDateTime from) {
        BooleanBuilder where = new BooleanBuilder()
                .and(qn.userId.eq(userId))
                .and(qn.deletedAt.isNull());
        if (from != null) {
            where.and(qn.createdAt.goe(from));
        }
        if (StringUtils.hasText(keyword)) {
            where.and(qn.content.containsIgnoreCase(keyword));
        }
        return where;
    }
}
