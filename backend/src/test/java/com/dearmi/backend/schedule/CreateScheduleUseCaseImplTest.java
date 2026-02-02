package com.dearmi.backend.schedule;

import com.dearmi.backend.application.schedule.dto.CreateScheduleCommand;
import com.dearmi.backend.application.schedule.dto.ScheduleResult;
import com.dearmi.backend.application.schedule.usecase.CreateScheduleUseCaseImpl;
import com.dearmi.backend.domain.hospital.HospitalSchedule;
import com.dearmi.backend.domain.hospital.HospitalScheduleRepository;
import com.dearmi.backend.domain.hospital.ScheduleStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CreateScheduleUseCaseImplTest {

    @Mock
    private HospitalScheduleRepository hospitalScheduleRepository;

    @InjectMocks
    private CreateScheduleUseCaseImpl createScheduleUseCase;

    @Test
    @DisplayName("일정 생성 시 저장 후 ScheduleResult를 반환한다")
    void create_success() {
        UUID userId = UUID.randomUUID();
        LocalDateTime scheduledAt = LocalDateTime.of(2026, 4, 15, 10, 0);
        CreateScheduleCommand command =
                new CreateScheduleCommand(userId, "서울대병원", scheduledAt, "준비물 챙기기");

        HospitalSchedule savedSchedule = HospitalSchedule.builder()
                .userId(userId)
                .hospitalName("서울대병원")
                .scheduledAt(scheduledAt)
                .memo("준비물 챙기기")
                .build();
        when(hospitalScheduleRepository.save(any(HospitalSchedule.class))).thenReturn(savedSchedule);

        ScheduleResult result = createScheduleUseCase.create(command);

        assertThat(result.hospitalName()).isEqualTo("서울대병원");
        assertThat(result.status()).isEqualTo(ScheduleStatus.SCHEDULED.name());
        assertThat(result.hasCounselingRecord()).isFalse(); // 신규 생성 → 항상 false
        verify(hospitalScheduleRepository).save(any(HospitalSchedule.class));
    }

    @Test
    @DisplayName("memo가 null이어도 일정이 정상 생성된다")
    void create_with_null_memo() {
        UUID userId = UUID.randomUUID();
        LocalDateTime scheduledAt = LocalDateTime.of(2026, 5, 1, 9, 0);
        CreateScheduleCommand command =
                new CreateScheduleCommand(userId, "강남세브란스", scheduledAt, null);

        HospitalSchedule savedSchedule = HospitalSchedule.builder()
                .userId(userId)
                .hospitalName("강남세브란스")
                .scheduledAt(scheduledAt)
                .build();
        when(hospitalScheduleRepository.save(any(HospitalSchedule.class))).thenReturn(savedSchedule);

        ScheduleResult result = createScheduleUseCase.create(command);

        assertThat(result.hospitalName()).isEqualTo("강남세브란스");
        assertThat(result.memo()).isNull();
    }
}
