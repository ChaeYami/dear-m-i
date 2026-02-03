package com.dearmi.backend.application.prepnote.usecase;

import com.dearmi.backend.application.prepnote.dto.PrepNoteResult;
import com.dearmi.backend.domain.prepnote.PrepNoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetPrepNotesUseCaseImpl implements GetPrepNotesUseCase {

    private final PrepNoteRepository prepNoteRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PrepNoteResult> getList(UUID userId, UUID scheduleId) {
        if (scheduleId != null) {
            return prepNoteRepository
                    .findByUserIdAndScheduleIdAndDeletedAtIsNull(userId, scheduleId)
                    .stream()
                    .map(PrepNoteResult::from)
                    .toList();
        }
        return prepNoteRepository
                .findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId)
                .stream()
                .map(PrepNoteResult::from)
                .toList();
    }
}
