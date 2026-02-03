package com.dearmi.backend.application.prepnote.usecase;

import com.dearmi.backend.application.prepnote.dto.CreatePrepNoteCommand;
import com.dearmi.backend.application.prepnote.dto.PrepNoteResult;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.hospital.HospitalScheduleRepository;
import com.dearmi.backend.domain.prepnote.PrepNote;
import com.dearmi.backend.domain.prepnote.PrepNoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CreatePrepNoteUseCaseImpl implements CreatePrepNoteUseCase {

    private final PrepNoteRepository prepNoteRepository;
    private final HospitalScheduleRepository hospitalScheduleRepository;

    @Override
    @Transactional
    public PrepNoteResult create(CreatePrepNoteCommand command) {
        // scheduleId가 있으면 ④ 원칙: 본인 일정인지 검증
        if (command.scheduleId() != null) {
            hospitalScheduleRepository
                    .findByIdAndUserIdAndDeletedAtIsNull(command.scheduleId(), command.userId())
                    .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));
        }

        PrepNote note = PrepNote.builder()
                .userId(command.userId())
                .scheduleId(command.scheduleId())
                .content(command.content())
                .build();

        return PrepNoteResult.from(prepNoteRepository.save(note));
    }
}
