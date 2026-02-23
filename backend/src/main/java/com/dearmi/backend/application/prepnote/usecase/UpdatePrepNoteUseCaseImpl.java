package com.dearmi.backend.application.prepnote.usecase;

import com.dearmi.backend.application.prepnote.dto.PrepNoteResult;
import com.dearmi.backend.application.prepnote.dto.UpdatePrepNoteCommand;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.dailynote.DailyNoteRepository;
import com.dearmi.backend.domain.prepnote.PrepNote;
import com.dearmi.backend.domain.prepnote.PrepNoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UpdatePrepNoteUseCaseImpl implements UpdatePrepNoteUseCase {

    private final PrepNoteRepository prepNoteRepository;
    private final DailyNoteRepository dailyNoteRepository;

    @Override
    @Transactional
    public PrepNoteResult update(UpdatePrepNoteCommand command) {
        PrepNote note = prepNoteRepository
                .findByIdAndUserIdAndDeletedAtIsNull(command.prepNoteId(), command.userId())
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        // linkedNoteIds 변경 시 DailyNote.usedInPrepNoteId 동기화
        if (command.linkedNoteIds() != null) {
            Set<UUID> oldIds = Set.copyOf(note.getLinkedNoteIds());
            Set<UUID> newIds = Set.copyOf(command.linkedNoteIds());

            // 새로 추가된 노트
            List<UUID> added = newIds.stream().filter(id -> !oldIds.contains(id)).toList();
            if (!added.isEmpty()) {
                dailyNoteRepository.findAllByIdInAndUserId(added, command.userId())
                        .forEach(n -> {
                            n.markUsedInPrepNote(note.getId());
                            dailyNoteRepository.save(n);
                        });
            }

            // 제거된 노트 — 링크 해제
            List<UUID> removed = oldIds.stream().filter(id -> !newIds.contains(id)).toList();
            if (!removed.isEmpty()) {
                dailyNoteRepository.findAllByIdInAndUserId(removed, command.userId())
                        .forEach(n -> {
                            n.clearPrepNoteLink();
                            dailyNoteRepository.save(n);
                        });
            }
        }

        note.update(command.content(), command.sections(), command.linkedNoteIds());
        return PrepNoteResult.from(prepNoteRepository.save(note));
    }
}
