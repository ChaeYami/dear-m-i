package com.dearmi.backend.schedule;

import com.dearmi.backend.application.schedule.dto.ScheduleResult;
import com.dearmi.backend.application.schedule.usecase.GetMonthlySchedulesUseCaseImpl;
import com.dearmi.backend.domain.counseling.CounselingRecordRepository;
import com.dearmi.backend.domain.schedule.HospitalSchedule;
import com.dearmi.backend.domain.schedule.HospitalScheduleRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetMonthlySchedulesUseCaseImplTest {

    @Mock private HospitalScheduleRepository hospitalScheduleRepository;
    @Mock private CounselingRecordRepository counselingRecordRepository;

    @InjectMocks
    private GetMonthlySchedulesUseCaseImpl getMonthlySchedulesUseCase;

    @Test
    @DisplayName("월별 조회 시 일정 목록과 hasCounselingRecord가 정확히 반환된다")
    void getMonthly_maps_hasCounselingRecord_correctly() {
        UUID userId = UUID.randomUUID();

        HospitalSchedule schedule1 = HospitalSchedule.builder()
                .userId(userId).hospitalName("병원A")
                .scheduledAt(LocalDateTime.of(2026, 4, 5, 10, 0)).build();
        HospitalSchedule schedule2 = HospitalSchedule.builder()
                .userId(userId).hospitalName("병원B")
                .scheduledAt(LocalDateTime.of(2026, 4, 20, 14, 0)).build();

        when(hospitalScheduleRepository.findByUserIdAndMonth(userId, 2026, 4))
                .thenReturn(List.of(schedule1, schedule2));

        // HashSet 반환: null-safe (Set.of()는 contains(null) 시 NPE 발생)
        // 테스트 엔티티는 id=null이므로 두 일정 모두 hasCounselingRecord=false
        when(counselingRecordRepository.findScheduleIdsHavingRecords(eq(userId), any()))
                .thenReturn(new HashSet<>());

        List<ScheduleResult> results = getMonthlySchedulesUseCase.getMonthly(userId, 2026, 4);

        assertThat(results).hasSize(2);
        assertThat(results.get(0).hospitalName()).isEqualTo("병원A");
        assertThat(results.get(1).hospitalName()).isEqualTo("병원B");
        assertThat(results).allSatisfy(r -> assertThat(r.hasCounselingRecord()).isFalse());
    }

    @Test
    @DisplayName("해당 월에 일정이 없으면 빈 목록을 반환한다")
    void getMonthly_returns_empty_when_no_schedules() {
        UUID userId = UUID.randomUUID();
        when(hospitalScheduleRepository.findByUserIdAndMonth(userId, 2026, 2))
                .thenReturn(List.of());

        List<ScheduleResult> results = getMonthlySchedulesUseCase.getMonthly(userId, 2026, 2);

        assertThat(results).isEmpty();
    }
}
