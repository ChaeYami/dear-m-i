package com.dearmi.backend.schedule;

import com.dearmi.backend.application.schedule.usecase.DeleteScheduleUseCaseImpl;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.counseling.CounselingRecordRepository;
import com.dearmi.backend.domain.schedule.HospitalSchedule;
import com.dearmi.backend.domain.schedule.HospitalScheduleRepository;
import com.dearmi.backend.domain.notification.NotificationRepository;
import com.dearmi.backend.domain.prepnote.PrepNoteRepository;
import com.dearmi.backend.domain.prescription.PrescriptionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeleteScheduleUseCaseImplTest {

    @Mock private HospitalScheduleRepository hospitalScheduleRepository;
    @Mock private CounselingRecordRepository counselingRecordRepository;
    @Mock private PrescriptionRepository prescriptionRepository;
    @Mock private PrepNoteRepository prepNoteRepository;
    @Mock private NotificationRepository notificationRepository;

    @InjectMocks
    private DeleteScheduleUseCaseImpl deleteScheduleUseCase;

    @Test
    @DisplayName("소프트 딜리트 후 연관 데이터 detach가 모두 호출된다 (⑤ 원칙)")
    void delete_softDeletes_and_detaches_all_related() {
        UUID userId = UUID.randomUUID();
        UUID scheduleId = UUID.randomUUID();
        HospitalSchedule schedule = HospitalSchedule.builder()
                .userId(userId)
                .hospitalName("연세병원")
                .scheduledAt(LocalDateTime.of(2026, 4, 20, 11, 0))
                .build();

        when(hospitalScheduleRepository.findByIdAndUserIdAndDeletedAtIsNull(scheduleId, userId))
                .thenReturn(Optional.of(schedule));
        when(hospitalScheduleRepository.save(any())).thenReturn(schedule);

        deleteScheduleUseCase.delete(userId, scheduleId);

        // 소프트 딜리트 여부 확인
        assertThat(schedule.getDeletedAt()).isNotNull();

        // ⑤ 원칙: 3개 연관 엔티티 모두 detach 호출 확인
        verify(counselingRecordRepository).detachSchedule(scheduleId);
        verify(prescriptionRepository).detachSchedule(scheduleId);
        verify(prepNoteRepository).detachSchedule(scheduleId);
    }

    @Test
    @DisplayName("존재하지 않거나 타인 일정 삭제 시 NOT_FOUND 예외 발생")
    void delete_not_found() {
        UUID userId = UUID.randomUUID();
        UUID scheduleId = UUID.randomUUID();

        when(hospitalScheduleRepository.findByIdAndUserIdAndDeletedAtIsNull(scheduleId, userId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> deleteScheduleUseCase.delete(userId, scheduleId))
                .isInstanceOf(CustomException.class)
                .satisfies(ex -> assertThat(((CustomException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.NOT_FOUND.getCode()));

        verifyNoInteractions(counselingRecordRepository, prescriptionRepository, prepNoteRepository);
    }
}
