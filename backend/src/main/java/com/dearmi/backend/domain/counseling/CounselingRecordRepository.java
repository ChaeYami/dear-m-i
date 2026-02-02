package com.dearmi.backend.domain.counseling;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CounselingRecordRepository {

    CounselingRecord save(CounselingRecord record);

    /** ④ 원칙: userId 검증 포함 조회 */
    Optional<CounselingRecord> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    List<CounselingRecord> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID userId);

    /** 프리미엄: 기간 필터 조회 */
    List<CounselingRecord> findByUserIdAndDeletedAtIsNullAndCreatedAtAfterOrderByCreatedAtDesc(UUID userId, LocalDateTime after);

    /** hospital_schedules 소프트 딜리트 시 연결 해제 (⑤ 원칙) */
    void detachSchedule(UUID scheduleId);
}
