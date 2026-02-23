package com.dearmi.backend.application.dailynote.usecase;

import com.dearmi.backend.application.dailynote.dto.CreateDailyNoteCommand;
import com.dearmi.backend.application.dailynote.dto.DailyNoteResult;

public interface CreateDailyNoteUseCase {
    DailyNoteResult create(CreateDailyNoteCommand command);
}
