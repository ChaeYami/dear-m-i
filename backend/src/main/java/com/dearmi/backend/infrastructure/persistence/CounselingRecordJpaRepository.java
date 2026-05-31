package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.record.CounselingRecord;
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

    /** 해당 일정에 활성 상담 기록 존재 여부 */
    boolean existsByScheduleIdAndDeletedAtIsNull(UUID scheduleId);

    /** 배치 조회: scheduleIds 중 활성 상담 기록을 가진 schedule_id 목록 반환 */
    @Query("SELECT c.scheduleId FROM CounselingRecord c WHERE c.userId = :userId AND c.scheduleId IN :scheduleIds AND c.deletedAt IS NULL")
    List<UUID> findScheduleIdsHavingRecords(@Param("userId") UUID userId, @Param("scheduleIds") List<UUID> scheduleIds);
}
