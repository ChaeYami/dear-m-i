package com.dearmi.backend.application.medication.usecase;

import java.util.List;
import java.util.UUID;

public interface AssignSlotGroupUseCase {
    /** scheduleId의 지정된 timeSlots에 groupId를 연결. groupId=null이면 그룹 해제. */
    void assign(UUID userId, UUID scheduleId, List<String> timeSlots, UUID groupId);
}
