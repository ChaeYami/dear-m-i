package com.dearmi.backend.prepnote;

import com.dearmi.backend.application.prepnote.dto.PrepNoteResult;
import com.dearmi.backend.application.prepnote.usecase.GetPrepNotesUseCaseImpl;
import com.dearmi.backend.domain.prepnote.PrepNote;
import com.dearmi.backend.domain.prepnote.PrepNoteRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GetPrepNotesUseCaseImplTest {

    @Mock private PrepNoteRepository prepNoteRepository;

    @InjectMocks
    private GetPrepNotesUseCaseImpl getPrepNotesUseCase;

    @Test
    @DisplayName("scheduleId 없으면 전체 목록 조회")
    void getList_all_when_no_scheduleId() {
        UUID userId = UUID.randomUUID();
        PrepNote note1 = PrepNote.builder().userId(userId).content("메모1").build();
        PrepNote note2 = PrepNote.builder().userId(userId).content("메모2").build();

        when(prepNoteRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId))
                .thenReturn(List.of(note1, note2));

        List<PrepNoteResult> result = getPrepNotesUseCase.getList(userId, null);

        assertThat(result).hasSize(2);
        verify(prepNoteRepository).findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId);
        verifyNoMoreInteractions(prepNoteRepository);
    }

    @Test
    @DisplayName("scheduleId 있으면 해당 일정의 메모만 조회")
    void getList_filtered_by_scheduleId() {
        UUID userId = UUID.randomUUID();
        UUID scheduleId = UUID.randomUUID();
        PrepNote note = PrepNote.builder().userId(userId).scheduleId(scheduleId).content("일정별 메모").build();

        when(prepNoteRepository.findByUserIdAndScheduleIdAndDeletedAtIsNull(userId, scheduleId))
                .thenReturn(List.of(note));

        List<PrepNoteResult> result = getPrepNotesUseCase.getList(userId, scheduleId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).scheduleId()).isEqualTo(scheduleId);
        verify(prepNoteRepository).findByUserIdAndScheduleIdAndDeletedAtIsNull(userId, scheduleId);
        verifyNoMoreInteractions(prepNoteRepository);
    }

    @Test
    @DisplayName("메모가 없으면 빈 리스트 반환")
    void getList_returns_empty_when_none() {
        UUID userId = UUID.randomUUID();

        when(prepNoteRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId))
                .thenReturn(List.of());

        List<PrepNoteResult> result = getPrepNotesUseCase.getList(userId, null);

        assertThat(result).isEmpty();
    }
}
