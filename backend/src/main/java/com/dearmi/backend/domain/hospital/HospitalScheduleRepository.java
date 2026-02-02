package com.dearmi.backend.domain.hospital;

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

    void delete(HospitalSchedule schedule);
}
