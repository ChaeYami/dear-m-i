package com.dearmi.backend.application.dailynote.usecase;

import com.dearmi.backend.application.dailynote.dto.DailyNoteResult;
import com.dearmi.backend.domain.dailynote.NoteType;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface GetDailyNotesUseCase {
    List<DailyNoteResult> getList(UUID userId, LocalDate startDate, LocalDate endDate, NoteType noteType);
}
