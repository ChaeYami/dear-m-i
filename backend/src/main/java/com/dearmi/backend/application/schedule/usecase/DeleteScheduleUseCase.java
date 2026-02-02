package com.dearmi.backend.application.schedule.usecase;

import java.util.UUID;

public interface DeleteScheduleUseCase {
    /** soft delete + ⑤ 원칙: 연관 데이터 schedule_id NULL 처리 */
    void delete(UUID userId, UUID scheduleId);
}
