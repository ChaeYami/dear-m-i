package com.dearmi.backend.domain.prepnote;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PrepNoteRepository {

    PrepNote save(PrepNote prepNote);

    /** ④ 원칙: userId 검증 포함 조회 */
    Optional<PrepNote> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    /** 전체 목록 (미연결 포함) */
    List<PrepNote> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID userId);

    /** 일정별 필터 조회 */
    List<PrepNote> findByUserIdAndScheduleIdAndDeletedAtIsNull(UUID userId, UUID scheduleId);

    /** D-0 알림: 해당 일정에 준비 메모 존재 여부 */
    boolean existsByScheduleIdAndDeletedAtIsNull(UUID scheduleId);

    /** 통합 검색: content LIKE (keyword null이면 전체 범위 조회) */
    List<PrepNote> searchByKeyword(UUID userId, String keyword, LocalDateTime from, int offset, int limit);

    long countByKeyword(UUID userId, String keyword, LocalDateTime from);

    /** hospital_schedules 소프트 딜리트 시 연결 해제 (⑤ 원칙) */
    void detachSchedule(UUID scheduleId);
}
