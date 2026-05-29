package com.dearmi.backend.prepnote;

import com.dearmi.backend.application.prepnote.usecase.DeletePrepNoteUseCaseImpl;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.dailynote.DailyNoteRepository;
import com.dearmi.backend.domain.prepnote.PrepNote;
import com.dearmi.backend.domain.prepnote.PrepNoteRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeletePrepNoteUseCaseImplTest {

    @Mock private PrepNoteRepository prepNoteRepository;
    @Mock private DailyNoteRepository dailyNoteRepository;

    @InjectMocks
    private DeletePrepNoteUseCaseImpl deletePrepNoteUseCase;

    @Test
    @DisplayName("본인 메모 소프트 딜리트 성공")
    void delete_soft_deletes_note() {
        UUID userId = UUID.randomUUID();
        UUID noteId = UUID.randomUUID();
        PrepNote note = PrepNote.builder().userId(userId).content("준비 메모").build();

        when(prepNoteRepository.findByIdAndUserIdAndDeletedAtIsNull(noteId, userId))
                .thenReturn(Optional.of(note));
        when(dailyNoteRepository.findByUsedInPrepNoteId(noteId)).thenReturn(List.of());
        when(prepNoteRepository.save(any())).thenReturn(note);

        deletePrepNoteUseCase.delete(userId, noteId);

        assertThat(note.getDeletedAt()).isNotNull();
        verify(prepNoteRepository).save(note);
    }

    @Test
    @DisplayName("존재하지 않거나 타인 메모 삭제 시 NOT_FOUND 예외 발생 (④ 원칙)")
    void delete_not_found_or_other_user() {
        UUID userId = UUID.randomUUID();
        UUID noteId = UUID.randomUUID();

        when(prepNoteRepository.findByIdAndUserIdAndDeletedAtIsNull(noteId, userId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> deletePrepNoteUseCase.delete(userId, noteId))
                .isInstanceOf(CustomException.class)
                .satisfies(ex -> assertThat(((CustomException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.NOT_FOUND.getCode()));

        verify(prepNoteRepository, never()).save(any());
    }
}
