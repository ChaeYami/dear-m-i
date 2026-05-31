package com.dearmi.backend.domain.record;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface CounselingRecordRepository {

    CounselingRecord save(CounselingRecord record);

    /** ④ 원칙: userId 검증 포함 조회 */
    Optional<CounselingRecord> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    List<CounselingRecord> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID userId);

    /** 프리미엄: 기간 필터 조회 */
    List<CounselingRecord> findByUserIdAndDeletedAtIsNullAndCreatedAtAfterOrderByCreatedAtDesc(UUID userId, LocalDateTime after);

    /** 타임라인 페이지네이션 (createdAt DESC, deleted_at IS NULL) */
    List<CounselingRecord> findByUserIdOrderByCreatedAtDesc(UUID userId, int offset, int limit);

    /** 타임라인 전체 카운트 */
    long countByUserIdAndDeletedAtIsNull(UUID userId);

    /** FREE 플랜 2개월 제한: 날짜 필터 + 페이지네이션 */
    List<CounselingRecord> findByUserIdAndDeletedAtIsNullAndCreatedAtAfterOrderByCreatedAtDesc(
            UUID userId, LocalDateTime after, int offset, int limit);

    long countByUserIdAndDeletedAtIsNullAndCreatedAtAfter(UUID userId, LocalDateTime after);

    /** hospital_schedules 소프트 딜리트 시 연결 해제 (⑤ 원칙) */
    void detachSchedule(UUID scheduleId);

    /** 해당 scheduleId로 활성 상담 기록이 존재하는지 확인 */
    boolean existsByScheduleIdAndDeletedAtIsNull(UUID scheduleId);

    /** 주어진 scheduleId 목록 중 활성 상담 기록을 가진 것만 반환 (월별 목록 hasCounselingRecord 배치 조회) */
    Set<UUID> findScheduleIdsHavingRecords(UUID userId, List<UUID> scheduleIds);
}
