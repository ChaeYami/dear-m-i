package com.dearmi.backend.application.prepnote.usecase;

import com.dearmi.backend.application.prepnote.dto.CreatePrepNoteCommand;
import com.dearmi.backend.application.prepnote.dto.PrepNoteResult;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.dailynote.DailyNote;
import com.dearmi.backend.domain.dailynote.DailyNoteRepository;
import com.dearmi.backend.domain.hospital.HospitalScheduleRepository;
import com.dearmi.backend.domain.prepnote.PrepNote;
import com.dearmi.backend.domain.prepnote.PrepNoteRepository;
import com.dearmi.backend.domain.prepnote.PrepNoteSections;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CreatePrepNoteUseCaseImpl implements CreatePrepNoteUseCase {

    private final PrepNoteRepository prepNoteRepository;
    private final HospitalScheduleRepository hospitalScheduleRepository;
    private final DailyNoteRepository dailyNoteRepository;

    @Override
    @Transactional
    public PrepNoteResult create(CreatePrepNoteCommand command) {
        if (command.scheduleId() != null) {
            hospitalScheduleRepository
                    .findByIdAndUserIdAndDeletedAtIsNull(command.scheduleId(), command.userId())
                    .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));
        }

        List<java.util.UUID> linkedIds = command.linkedNoteIds() != null ? command.linkedNoteIds() : List.of();

        PrepNote note = PrepNote.builder()
                .userId(command.userId())
                .scheduleId(command.scheduleId())
                .content(command.content())
                .sections(command.sections() != null ? command.sections() : new PrepNoteSections())
                .linkedNoteIds(linkedIds)
                .build();

        PrepNote saved = prepNoteRepository.save(note);

        // 선택된 DailyNote에 usedInPrepNoteId 표기
        if (!linkedIds.isEmpty()) {
            List<DailyNote> dailyNotes = dailyNoteRepository.findAllByIdInAndUserId(linkedIds, command.userId());
            dailyNotes.forEach(n -> {
                n.markUsedInPrepNote(saved.getId());
                dailyNoteRepository.save(n);
            });
        }

        return PrepNoteResult.from(saved);
    }
}
