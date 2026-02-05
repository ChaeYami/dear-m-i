package com.dearmi.backend.application.schedule.usecase;

import com.dearmi.backend.application.schedule.dto.ScheduleResult;

import java.util.List;
import java.util.UUID;

/**
 * 사용자의 전체 일정 조회 (캘린더 없이 목록 표시용)
 * scheduledAt DESC 정렬, deleted_at IS NULL
 */
public interface GetAllSchedulesUseCase {
    List<ScheduleResult> getAll(UUID userId);
}
