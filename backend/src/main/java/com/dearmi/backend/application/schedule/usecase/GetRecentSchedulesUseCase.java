package com.dearmi.backend.application.schedule.usecase;

import com.dearmi.backend.application.schedule.dto.ScheduleResult;

import java.util.List;
import java.util.UUID;

/**
 * 폼 드롭다운용 최근 일정 조회
 * - direction=PAST: 과거 일정 내림차순 (RecordForm 진료 기록 작성용)
 * - direction=FUTURE: 다가오는 일정 오름차순 (PrepNoteForm 준비 메모 작성용)
 */
public interface GetRecentSchedulesUseCase {

    enum Direction { PAST, FUTURE }

    List<ScheduleResult> get(UUID userId, Direction direction, int limit);
}
