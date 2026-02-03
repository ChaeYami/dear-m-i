package com.dearmi.backend.application.prepnote.usecase;

import java.util.UUID;

public interface DeletePrepNoteUseCase {
    void delete(UUID userId, UUID prepNoteId);
}
