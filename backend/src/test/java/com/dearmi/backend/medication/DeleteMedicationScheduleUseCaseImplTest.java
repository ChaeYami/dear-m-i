package com.dearmi.backend.medication;

import com.dearmi.backend.application.medication.usecase.DeleteMedicationScheduleUseCaseImpl;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.domain.medication.MedicationLog;
import com.dearmi.backend.domain.medication.MedicationLogRepository;
import com.dearmi.backend.domain.medication.MedicationSchedule;
import com.dearmi.backend.domain.medication.MedicationScheduleRepository;
import com.dearmi.backend.domain.notification.NotificationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeleteMedicationScheduleUseCaseImplTest {

    @Mock private MedicationScheduleRepository medicationScheduleRepository;
    @Mock private MedicationLogRepository medicationLogRepository;
    @Mock private NotificationRepository notificationRepository;

    @InjectMocks
    private DeleteMedicationScheduleUseCaseImpl deleteUseCase;

    @Test
    @DisplayName("복약 일정 삭제 시 logs를 먼저 삭제하고 소프트딜리트한다 (⑤ 원칙)")
    void delete_cascades_logs_and_soft_deletes_schedule() {
        UUID userId = UUID.randomUUID();
        UUID scheduleId = UUID.randomUUID();

        MedicationSchedule schedule = MedicationSchedule.builder()
                .userId(userId).drugName("약품").morning(true).build();
        when(medicationScheduleRepository.findByIdAndUserIdAndDeletedAtIsNull(scheduleId, userId))
                .thenReturn(Optional.of(schedule));
        when(medicationScheduleRepository.save(any())).thenReturn(schedule);

        deleteUseCase.delete(userId, scheduleId);

        // logs 먼저 삭제 (⑤ 원칙)
        verify(medicationLogRepository).deleteByMedicationScheduleId(scheduleId);
        // 소프트딜리트 저장
        verify(medicationScheduleRepository).save(schedule);
        // 삭제 후 deleted_at이 설정됨
        assert schedule.isDeleted();
    }

    @Test
    @DisplayName("타인의 복약 일정 삭제 시 404가 발생한다")
    void delete_other_user_schedule_throws_not_found() {
        UUID userId = UUID.randomUUID();
        UUID scheduleId = UUID.randomUUID();

        when(medicationScheduleRepository.findByIdAndUserIdAndDeletedAtIsNull(scheduleId, userId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> deleteUseCase.delete(userId, scheduleId))
                .isInstanceOf(CustomException.class);

        verifyNoInteractions(medicationLogRepository);
    }
}
