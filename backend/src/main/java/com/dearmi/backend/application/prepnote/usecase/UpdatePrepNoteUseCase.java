package com.dearmi.backend.application.prepnote.usecase;

import com.dearmi.backend.application.prepnote.dto.PrepNoteResult;
import com.dearmi.backend.application.prepnote.dto.UpdatePrepNoteCommand;

public interface UpdatePrepNoteUseCase {
    PrepNoteResult update(UpdatePrepNoteCommand command);
}
