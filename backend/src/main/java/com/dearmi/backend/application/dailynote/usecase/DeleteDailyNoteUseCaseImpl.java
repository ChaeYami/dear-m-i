package com.dearmi.backend.application.dailynote.usecase;

import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.dailynote.DailyNote;
import com.dearmi.backend.domain.dailynote.DailyNoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DeleteDailyNoteUseCaseImpl implements DeleteDailyNoteUseCase {

    private final DailyNoteRepository dailyNoteRepository;

    @Override
    @Transactional
    public void delete(UUID userId, UUID noteId) {
        DailyNote note = dailyNoteRepository
                .findByIdAndUserIdAndDeletedAtIsNull(noteId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        note.softDelete();
        dailyNoteRepository.save(note);
    }
}
