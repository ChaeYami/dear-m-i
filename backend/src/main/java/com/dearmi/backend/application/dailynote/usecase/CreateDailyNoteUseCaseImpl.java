package com.dearmi.backend.application.dailynote.usecase;

import com.dearmi.backend.application.dailynote.dto.CreateDailyNoteCommand;
import com.dearmi.backend.application.dailynote.dto.DailyNoteResult;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.dailynote.DailyNote;
import com.dearmi.backend.domain.dailynote.DailyNoteRepository;
import com.dearmi.backend.domain.dailynote.NoteType;
import com.dearmi.backend.domain.subscription.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class CreateDailyNoteUseCaseImpl implements CreateDailyNoteUseCase {

    private static final int FREE_BODY_MAX_LENGTH = 100;
    private static final int PREMIUM_BODY_MAX_LENGTH = 300;

    private final DailyNoteRepository dailyNoteRepository;
    private final SubscriptionRepository subscriptionRepository;

    @Override
    @Transactional
    public DailyNoteResult create(CreateDailyNoteCommand command) {
        boolean isPremium = subscriptionRepository.findByUserId(command.userId())
                .map(s -> s.isPremium())
                .orElse(false);

        int maxLength = isPremium ? PREMIUM_BODY_MAX_LENGTH : FREE_BODY_MAX_LENGTH;
        if (command.body().length() > maxLength) {
            throw new CustomException(ErrorCode.CONTENT_LIMIT_EXCEEDED, maxLength);
        }

        LocalDate noteDate = command.noteDate() != null ? command.noteDate() : LocalDate.now();
        if (noteDate.isAfter(LocalDate.now())) {
            throw new CustomException(ErrorCode.INVALID_REQUEST, "미래 날짜에는 기록할 수 없습니다.");
        }

        DailyNote note = DailyNote.builder()
                .userId(command.userId())
                .body(command.body())
                .noteType(command.noteType() != null ? command.noteType() : NoteType.OTHER)
                .noteDate(noteDate)
                .build();

        return DailyNoteResult.from(dailyNoteRepository.save(note));
    }
}
