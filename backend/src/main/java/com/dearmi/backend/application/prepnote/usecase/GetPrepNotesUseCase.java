package com.dearmi.backend.application.prepnote.usecase;

import com.dearmi.backend.application.prepnote.dto.PrepNoteResult;

import java.util.List;
import java.util.UUID;

public interface GetPrepNotesUseCase {
    /**
     * @param scheduleId null이면 전체 목록, 값이 있으면 해당 일정의 메모만 반환
     */
    List<PrepNoteResult> getList(UUID userId, UUID scheduleId);
}
