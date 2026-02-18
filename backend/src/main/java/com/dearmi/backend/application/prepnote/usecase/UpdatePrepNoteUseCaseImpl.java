package com.dearmi.backend.application.prepnote.usecase;

import com.dearmi.backend.application.prepnote.dto.PrepNoteResult;
import com.dearmi.backend.application.prepnote.dto.UpdatePrepNoteCommand;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.prepnote.PrepNote;
import com.dearmi.backend.domain.prepnote.PrepNoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UpdatePrepNoteUseCaseImpl implements UpdatePrepNoteUseCase {

    private final PrepNoteRepository prepNoteRepository;

    @Override
    @Transactional
    public PrepNoteResult update(UpdatePrepNoteCommand command) {
        // ④ 원칙: userId 검증 포함 조회
        PrepNote note = prepNoteRepository
                .findByIdAndUserIdAndDeletedAtIsNull(command.prepNoteId(), command.userId())
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        note.update(command.content(), command.sections());
        return PrepNoteResult.from(prepNoteRepository.save(note));
    }
}
