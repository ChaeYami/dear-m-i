package com.dearmi.backend.application.dailynote.usecase;

import java.util.UUID;

public interface DeleteDailyNoteUseCase {
    void delete(UUID userId, UUID noteId);
}
