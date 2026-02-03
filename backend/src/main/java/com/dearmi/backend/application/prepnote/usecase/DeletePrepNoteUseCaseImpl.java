package com.dearmi.backend.application.prepnote.usecase;

import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
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

    @Override
    @Transactional
    public void delete(UUID userId, UUID prepNoteId) {
        // ④ 원칙: userId 검증 포함 조회
        PrepNote note = prepNoteRepository
                .findByIdAndUserIdAndDeletedAtIsNull(prepNoteId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        note.softDelete();
        prepNoteRepository.save(note);
    }
}
