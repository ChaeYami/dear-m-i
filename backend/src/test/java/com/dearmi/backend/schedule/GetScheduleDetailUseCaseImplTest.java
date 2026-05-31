package com.dearmi.backend.schedule;

import com.dearmi.backend.application.schedule.dto.ScheduleResult;
import com.dearmi.backend.application.schedule.usecase.GetScheduleDetailUseCaseImpl;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.record.CounselingRecordRepository;
import com.dearmi.backend.domain.schedule.HospitalSchedule;
import com.dearmi.backend.domain.schedule.HospitalScheduleRepository;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetScheduleDetailUseCaseImplTest {

    @Mock
    private HospitalScheduleRepository hospitalScheduleRepository;

    @Mock
    private CounselingRecordRepository counselingRecordRepository;

    @InjectMocks
    private GetScheduleDetailUseCaseImpl getScheduleDetailUseCase;

    @Test
    @DisplayName("본인 일정 조회 시 hasCounselingRecord가 정확히 반환된다")
    void getDetail_with_counseling_record() {
        UUID userId = UUID.randomUUID();
        UUID scheduleId = UUID.randomUUID();
        HospitalSchedule schedule = HospitalSchedule.builder()
                .userId(userId)
                .hospitalName("삼성병원")
                .scheduledAt(LocalDateTime.of(2026, 4, 10, 14, 0))
                .memo("검진")
                .build();

        when(hospitalScheduleRepository.findByIdAndUserIdAndDeletedAtIsNull(scheduleId, userId))
                .thenReturn(Optional.of(schedule));
        when(counselingRecordRepository.existsByScheduleIdAndDeletedAtIsNull(scheduleId))
                .thenReturn(true);

        ScheduleResult result = getScheduleDetailUseCase.getDetail(userId, scheduleId);

        assertThat(result.hospitalName()).isEqualTo("삼성병원");
        assertThat(result.hasCounselingRecord()).isTrue();
    }

    @Test
    @DisplayName("타인 일정 또는 존재하지 않는 일정 접근 시 NOT_FOUND(404) 예외가 발생한다")
    void getDetail_not_found_returns_404() {
        UUID userId = UUID.randomUUID();
        UUID scheduleId = UUID.randomUUID();

        when(hospitalScheduleRepository.findByIdAndUserIdAndDeletedAtIsNull(scheduleId, userId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> getScheduleDetailUseCase.getDetail(userId, scheduleId))
                .isInstanceOf(CustomException.class)
                .satisfies(ex -> {
                    CustomException customEx = (CustomException) ex;
                    assertThat(customEx.getErrorCode()).isEqualTo(ErrorCode.NOT_FOUND.getCode());
                });
    }
}
