package com.dearmi.backend.medication;

import com.dearmi.backend.application.medication.dto.CheckMedicationCommand;
import com.dearmi.backend.application.medication.dto.MedicationLogResult;
import com.dearmi.backend.application.medication.usecase.CheckMedicationUseCaseImpl;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.domain.medication.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CheckMedicationUseCaseImplTest {

    @Mock private MedicationScheduleRepository medicationScheduleRepository;
    @Mock private MedicationLogRepository medicationLogRepository;

    @InjectMocks
    private CheckMedicationUseCaseImpl checkMedicationUseCase;

    @Test
    @DisplayName("기존 로그 없으면 새로 생성하고 TAKEN 반환한다")
    void check_creates_new_log_when_absent() {
        UUID userId = UUID.randomUUID();
        UUID scheduleId = UUID.randomUUID();
        LocalDate today = LocalDate.now();

        MedicationSchedule schedule = MedicationSchedule.builder()
                .userId(userId).drugName("약품").morning(true).build();
        when(medicationScheduleRepository.findByIdAndUserIdAndDeletedAtIsNull(scheduleId, userId))
                .thenReturn(Optional.of(schedule));
        when(medicationLogRepository.findByMedicationScheduleIdAndLogDateAndTimeSlot(
                scheduleId, today, TimeSlot.MORNING.name()))
                .thenReturn(Optional.empty());

        MedicationLog newLog = MedicationLog.builder()
                .medicationScheduleId(scheduleId).userId(userId)
                .logDate(today).timeSlot(TimeSlot.MORNING.name())
                .status(MedicationLogStatus.TAKEN.name()).build();
        when(medicationLogRepository.save(any())).thenReturn(newLog);

        CheckMedicationCommand command = new CheckMedicationCommand(
                userId, scheduleId, today, TimeSlot.MORNING, MedicationLogStatus.TAKEN);

        MedicationLogResult result = checkMedicationUseCase.check(command);

        assertThat(result.status()).isEqualTo(MedicationLogStatus.TAKEN.name());
        verify(medicationLogRepository).save(any(MedicationLog.class));
    }

    @Test
    @DisplayName("기존 로그 있으면 상태를 업데이트(UPSERT)한다")
    void check_updates_existing_log() {
        UUID userId = UUID.randomUUID();
        UUID scheduleId = UUID.randomUUID();
        LocalDate today = LocalDate.now();

        MedicationSchedule schedule = MedicationSchedule.builder()
                .userId(userId).drugName("약품").morning(true).build();
        when(medicationScheduleRepository.findByIdAndUserIdAndDeletedAtIsNull(scheduleId, userId))
                .thenReturn(Optional.of(schedule));

        MedicationLog existingLog = MedicationLog.builder()
                .medicationScheduleId(scheduleId).userId(userId)
                .logDate(today).timeSlot(TimeSlot.MORNING.name())
                .status(MedicationLogStatus.TAKEN.name()).build();
        when(medicationLogRepository.findByMedicationScheduleIdAndLogDateAndTimeSlot(
                scheduleId, today, TimeSlot.MORNING.name()))
                .thenReturn(Optional.of(existingLog));
        when(medicationLogRepository.save(any())).thenReturn(existingLog);

        CheckMedicationCommand command = new CheckMedicationCommand(
                userId, scheduleId, today, TimeSlot.MORNING, MedicationLogStatus.SKIPPED);

        MedicationLogResult result = checkMedicationUseCase.check(command);

        verify(medicationLogRepository).save(existingLog);
    }

    @Test
    @DisplayName("타인의 복약 일정에 체크하면 404가 발생한다")
    void check_other_user_schedule_throws_not_found() {
        UUID userId = UUID.randomUUID();
        UUID scheduleId = UUID.randomUUID();

        when(medicationScheduleRepository.findByIdAndUserIdAndDeletedAtIsNull(scheduleId, userId))
                .thenReturn(Optional.empty());

        CheckMedicationCommand command = new CheckMedicationCommand(
                userId, scheduleId, LocalDate.now(), TimeSlot.MORNING, MedicationLogStatus.TAKEN);

        assertThatThrownBy(() -> checkMedicationUseCase.check(command))
                .isInstanceOf(CustomException.class);
    }
}
