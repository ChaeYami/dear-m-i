package com.dearmi.backend.application.prepnote.usecase;

import com.dearmi.backend.application.prepnote.dto.CreatePrepNoteCommand;
import com.dearmi.backend.application.prepnote.dto.PrepNoteResult;

public interface CreatePrepNoteUseCase {
    PrepNoteResult create(CreatePrepNoteCommand command);
}
