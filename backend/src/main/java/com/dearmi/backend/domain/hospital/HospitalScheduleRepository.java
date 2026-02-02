package com.dearmi.backend.domain.hospital;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HospitalScheduleRepository {

    HospitalSchedule save(HospitalSchedule schedule);

    /** ④ 원칙: userId 검증 포함 조회 */
    Optional<HospitalSchedule> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    List<HospitalSchedule> findByUserIdAndDeletedAtIsNullOrderByScheduledAtDesc(UUID userId);

    void delete(HospitalSchedule schedule);
}
