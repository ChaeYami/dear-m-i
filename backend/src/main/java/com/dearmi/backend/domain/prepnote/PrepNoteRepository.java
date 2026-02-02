package com.dearmi.backend.domain.prepnote;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PrepNoteRepository {

    PrepNote save(PrepNote prepNote);

    Optional<PrepNote> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    List<PrepNote> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID userId);

    /** hospital_schedules 소프트 딜리트 시 연결 해제 (⑤ 원칙) */
    void detachSchedule(UUID scheduleId);
}
