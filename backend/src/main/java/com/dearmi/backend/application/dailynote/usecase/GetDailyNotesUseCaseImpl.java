package com.dearmi.backend.application.dailynote.usecase;

import com.dearmi.backend.application.dailynote.dto.DailyNoteResult;
import com.dearmi.backend.domain.dailynote.DailyNoteRepository;
import com.dearmi.backend.domain.dailynote.NoteType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetDailyNotesUseCaseImpl implements GetDailyNotesUseCase {

    private final DailyNoteRepository dailyNoteRepository;

    @Override
    @Transactional(readOnly = true)
    public List<DailyNoteResult> getList(UUID userId, LocalDate startDate, LocalDate endDate, NoteType noteType) {
        return dailyNoteRepository.findByUserId(userId, startDate, endDate, noteType)
                .stream()
                .map(DailyNoteResult::from)
                .toList();
    }
}
