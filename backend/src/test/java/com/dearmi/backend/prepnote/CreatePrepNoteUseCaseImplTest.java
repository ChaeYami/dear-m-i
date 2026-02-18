package com.dearmi.backend.prepnote;

import com.dearmi.backend.application.prepnote.dto.CreatePrepNoteCommand;
import com.dearmi.backend.application.prepnote.dto.PrepNoteResult;
import com.dearmi.backend.application.prepnote.usecase.CreatePrepNoteUseCaseImpl;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.hospital.HospitalSchedule;
import com.dearmi.backend.domain.hospital.HospitalScheduleRepository;
import com.dearmi.backend.domain.prepnote.PrepNote;
import com.dearmi.backend.domain.prepnote.PrepNoteRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CreatePrepNoteUseCaseImplTest {

    @Mock private PrepNoteRepository prepNoteRepository;
    @Mock private HospitalScheduleRepository hospitalScheduleRepository;

    @InjectMocks
    private CreatePrepNoteUseCaseImpl createPrepNoteUseCase;

    @Test
    @DisplayName("scheduleId 없이 메모를 생성할 수 있다")
    void create_without_scheduleId() {
        UUID userId = UUID.randomUUID();
        PrepNote saved = PrepNote.builder().userId(userId).content("질문 리스트").build();
        when(prepNoteRepository.save(any())).thenReturn(saved);

        PrepNoteResult result = createPrepNoteUseCase.create(
                new CreatePrepNoteCommand(userId, null, "질문 리스트", null));

        assertThat(result.content()).isEqualTo("질문 리스트");
        assertThat(result.scheduleId()).isNull();
        verifyNoInteractions(hospitalScheduleRepository);
    }

    @Test
    @DisplayName("본인 일정에 scheduleId를 연결하여 메모를 생성할 수 있다")
    void create_with_valid_scheduleId() {
        UUID userId = UUID.randomUUID();
        UUID scheduleId = UUID.randomUUID();
        HospitalSchedule schedule = HospitalSchedule.builder()
                .userId(userId).hospitalName("서울대병원")
                .scheduledAt(LocalDateTime.now()).build();
        PrepNote saved = PrepNote.builder().userId(userId).scheduleId(scheduleId).content("증상 메모").build();

        when(hospitalScheduleRepository.findByIdAndUserIdAndDeletedAtIsNull(scheduleId, userId))
                .thenReturn(Optional.of(schedule));
        when(prepNoteRepository.save(any())).thenReturn(saved);

        PrepNoteResult result = createPrepNoteUseCase.create(
                new CreatePrepNoteCommand(userId, scheduleId, "증상 메모", null));

        assertThat(result.scheduleId()).isEqualTo(scheduleId);
        verify(hospitalScheduleRepository).findByIdAndUserIdAndDeletedAtIsNull(scheduleId, userId);
    }

    @Test
    @DisplayName("타인 일정 또는 존재하지 않는 scheduleId 연결 시 NOT_FOUND 예외 발생 (④ 원칙)")
    void create_with_invalid_scheduleId_throws_not_found() {
        UUID userId = UUID.randomUUID();
        UUID scheduleId = UUID.randomUUID();

        when(hospitalScheduleRepository.findByIdAndUserIdAndDeletedAtIsNull(scheduleId, userId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> createPrepNoteUseCase.create(
                new CreatePrepNoteCommand(userId, scheduleId, "내용", null)))
                .isInstanceOf(CustomException.class)
                .satisfies(ex -> assertThat(((CustomException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.NOT_FOUND.getCode()));

        verifyNoInteractions(prepNoteRepository);
    }
}
