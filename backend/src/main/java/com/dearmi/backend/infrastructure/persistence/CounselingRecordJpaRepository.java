package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.counseling.CounselingRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CounselingRecordJpaRepository extends JpaRepository<CounselingRecord, UUID> {

    Optional<CounselingRecord> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    List<CounselingRecord> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID userId);

    List<CounselingRecord> findByUserIdAndDeletedAtIsNullAndCreatedAtAfterOrderByCreatedAtDesc(UUID userId, LocalDateTime after);

    /** hospital_schedules 소프트 딜리트 시 schedule_id NULL 처리 (⑤ 원칙) */
    @Modifying
    @Query("UPDATE CounselingRecord c SET c.scheduleId = NULL WHERE c.scheduleId = :scheduleId")
    void detachSchedule(@Param("scheduleId") UUID scheduleId);
}
