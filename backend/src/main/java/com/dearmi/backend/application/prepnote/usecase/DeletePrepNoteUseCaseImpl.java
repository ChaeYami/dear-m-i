package com.dearmi.backend.application.prepnote.usecase;

import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.dailynote.DailyNoteRepository;
import com.dearmi.backend.domain.prepnote.PrepNote;
import com.dearmi.backend.domain.prepnote.PrepNoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DeletePrepNoteUseCaseImpl implements DeletePrepNoteUseCase {

    private final PrepNoteRepository prepNoteRepository;
    private final DailyNoteRepository dailyNoteRepository;

    @Override
    @Transactional
    public void delete(UUID userId, UUID prepNoteId) {
        PrepNote note = prepNoteRepository
                .findByIdAndUserIdAndDeletedAtIsNull(prepNoteId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        // PrepNote 삭제 시 연결된 DailyNote의 usedInPrepNoteId 링크 해제
        dailyNoteRepository.findByUsedInPrepNoteId(prepNoteId)
                .forEach(n -> {
                    n.clearPrepNoteLink();
                    dailyNoteRepository.save(n);
                });

        note.softDelete();
        prepNoteRepository.save(note);
    }
}
