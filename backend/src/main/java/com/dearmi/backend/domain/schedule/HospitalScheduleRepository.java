package com.dearmi.backend.domain.schedule;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HospitalScheduleRepository {

    HospitalSchedule save(HospitalSchedule schedule);

    /** ④ 원칙: userId 검증 포함 조회 */
    Optional<HospitalSchedule> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    List<HospitalSchedule> findByUserIdAndDeletedAtIsNullOrderByScheduledAtDesc(UUID userId);

    /** QueryDSL: 월별 필터 — scheduledAt이 해당 월 범위 내, deleted_at IS NULL, 본인 userId만 */
    List<HospitalSchedule> findByUserIdAndMonth(UUID userId, int year, int month);

    /** 최근 일정 — scheduledAt < now, DESC 정렬, 상위 N개 (RecordForm 드롭다운용) */
    List<HospitalSchedule> findPastByUserId(UUID userId, LocalDateTime now, int limit);

    /** 다가오는 일정 — scheduledAt >= now, ASC 정렬, 상위 N개 (PrepNoteForm 드롭다운용) */
    List<HospitalSchedule> findFutureByUserId(UUID userId, LocalDateTime now, int limit);

    void delete(HospitalSchedule schedule);

    /** 알림 발송용: deleted_at IS NULL 인 일정 중 scheduledAt이 [from, to) 범위인 것 */
    List<HospitalSchedule> findByScheduledAtBetweenAndDeletedAtIsNull(LocalDateTime from, LocalDateTime to);
}
