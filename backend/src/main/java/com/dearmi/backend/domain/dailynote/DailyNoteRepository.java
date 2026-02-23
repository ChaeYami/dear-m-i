package com.dearmi.backend.domain.dailynote;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DailyNoteRepository {

    DailyNote save(DailyNote note);

    /** ④ 원칙: userId 포함 조회 */
    Optional<DailyNote> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    /** 날짜 범위 + 타입 필터 목록 */
    List<DailyNote> findByUserId(UUID userId, LocalDate startDate, LocalDate endDate, NoteType noteType);

    /** PrepNote 링크된 노트 목록 (PrepNote 삭제 시 링크 해제용) */
    List<DailyNote> findByUsedInPrepNoteId(UUID prepNoteId);

    /** ID 목록으로 일괄 조회 */
    List<DailyNote> findAllByIdInAndUserId(List<UUID> ids, UUID userId);
}
