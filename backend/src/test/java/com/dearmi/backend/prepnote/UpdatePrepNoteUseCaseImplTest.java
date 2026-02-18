package com.dearmi.backend.prepnote;

import com.dearmi.backend.application.prepnote.dto.PrepNoteResult;
import com.dearmi.backend.application.prepnote.dto.UpdatePrepNoteCommand;
import com.dearmi.backend.application.prepnote.usecase.UpdatePrepNoteUseCaseImpl;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.prepnote.PrepNote;
import com.dearmi.backend.domain.prepnote.PrepNoteRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UpdatePrepNoteUseCaseImplTest {

    @Mock private PrepNoteRepository prepNoteRepository;

    @InjectMocks
    private UpdatePrepNoteUseCaseImpl updatePrepNoteUseCase;

    @Test
    @DisplayName("본인 메모 수정 성공")
    void update_success() {
        UUID userId = UUID.randomUUID();
        UUID noteId = UUID.randomUUID();
        PrepNote note = PrepNote.builder().userId(userId).content("기존 내용").build();
        PrepNote updated = PrepNote.builder().userId(userId).content("수정된 내용").build();

        when(prepNoteRepository.findByIdAndUserIdAndDeletedAtIsNull(noteId, userId))
                .thenReturn(Optional.of(note));
        when(prepNoteRepository.save(any())).thenReturn(updated);

        PrepNoteResult result = updatePrepNoteUseCase.update(
                new UpdatePrepNoteCommand(userId, noteId, "수정된 내용", null));

        assertThat(result.content()).isEqualTo("수정된 내용");
        verify(prepNoteRepository).save(note);
    }

    @Test
    @DisplayName("존재하지 않거나 타인 메모 수정 시 NOT_FOUND 예외 발생 (④ 원칙)")
    void update_not_found_or_other_user() {
        UUID userId = UUID.randomUUID();
        UUID noteId = UUID.randomUUID();

        when(prepNoteRepository.findByIdAndUserIdAndDeletedAtIsNull(noteId, userId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> updatePrepNoteUseCase.update(
                new UpdatePrepNoteCommand(userId, noteId, "수정", null)))
                .isInstanceOf(CustomException.class)
                .satisfies(ex -> assertThat(((CustomException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.NOT_FOUND.getCode()));

        verify(prepNoteRepository, never()).save(any());
    }
}
