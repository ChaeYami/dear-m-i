package com.dearmi.backend.medication;

import com.dearmi.backend.application.medication.dto.TodayMedicationResult;
import com.dearmi.backend.application.medication.usecase.GetTodayMedicationUseCaseImpl;
import com.dearmi.backend.domain.medication.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GetTodayMedicationUseCaseImplTest {

    @Mock private MedicationScheduleRepository medicationScheduleRepository;
    @Mock private MedicationLogRepository medicationLogRepository;

    @InjectMocks
    private GetTodayMedicationUseCaseImpl getTodayUseCase;

    @Test
    @DisplayName("오늘 활성 복약 일정과 로그 상태를 반환한다")
    void getToday_returns_schedules_with_slot_logs() {
        UUID userId = UUID.randomUUID();
        UUID scheduleId = UUID.randomUUID();
        LocalDate today = LocalDate.now();

        MedicationSchedule schedule = MedicationSchedule.builder()
                .userId(userId).drugName("아스피린").dosage("100mg")
                .morning(true).afternoon(false).evening(true).bedtime(false)
                .build();

        when(medicationScheduleRepository.findActiveForDateAndUserId(today, userId))
                .thenReturn(List.of(schedule));

        MedicationLog morningLog = MedicationLog.builder()
                .medicationScheduleId(scheduleId).userId(userId)
                .logDate(today).timeSlot(TimeSlot.MORNING.name())
                .status(MedicationLogStatus.TAKEN.name()).build();

        when(medicationLogRepository.findByMedicationScheduleIdAndLogDate(
                schedule.getId(), today))
                .thenReturn(List.of(morningLog));

        TodayMedicationResult result = getTodayUseCase.getToday(userId);

        assertThat(result.schedules()).hasSize(1);
        TodayMedicationResult.ScheduleWithLogs sw = result.schedules().get(0);
        assertThat(sw.drugName()).isEqualTo("아스피린");
        // morning=true, evening=true → 2개 슬롯
        assertThat(sw.slots()).hasSize(2);
        // MORNING 슬롯은 TAKEN 로그 있음
        TodayMedicationResult.SlotLog morningSlot = sw.slots().get(0);
        assertThat(morningSlot.timeSlot()).isEqualTo(TimeSlot.MORNING.name());
        assertThat(morningSlot.status()).isEqualTo(MedicationLogStatus.TAKEN.name());
        // EVENING 슬롯은 로그 없음 (null)
        TodayMedicationResult.SlotLog eveningSlot = sw.slots().get(1);
        assertThat(eveningSlot.timeSlot()).isEqualTo(TimeSlot.EVENING.name());
        assertThat(eveningSlot.status()).isNull();
    }

    @Test
    @DisplayName("오늘 활성 일정이 없으면 빈 목록을 반환한다")
    void getToday_returns_empty_when_no_schedules() {
        UUID userId = UUID.randomUUID();
        when(medicationScheduleRepository.findActiveForDateAndUserId(any(), eq(userId)))
                .thenReturn(List.of());

        TodayMedicationResult result = getTodayUseCase.getToday(userId);

        assertThat(result.schedules()).isEmpty();
        verifyNoInteractions(medicationLogRepository);
    }
}
