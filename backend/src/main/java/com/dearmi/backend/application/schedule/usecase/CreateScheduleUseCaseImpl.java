package com.dearmi.backend.application.schedule.usecase;

import com.dearmi.backend.application.schedule.dto.CreateScheduleCommand;
import com.dearmi.backend.application.schedule.dto.ScheduleResult;
import com.dearmi.backend.domain.hospital.HospitalSchedule;
import com.dearmi.backend.domain.hospital.HospitalScheduleRepository;
import com.dearmi.backend.domain.hospital.ScheduleStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CreateScheduleUseCaseImpl implements CreateScheduleUseCase {

    private final HospitalScheduleRepository hospitalScheduleRepository;

    @Override
    @Transactional
    public ScheduleResult create(CreateScheduleCommand command) {
        HospitalSchedule schedule = HospitalSchedule.builder()
                .userId(command.userId())
                .hospitalName(command.hospitalName())
                .scheduledAt(command.scheduledAt())
                .memo(command.memo())
                .build();

        HospitalSchedule saved = hospitalScheduleRepository.save(schedule);

        // 신규 생성이므로 상담 기록 없음
        return toResult(saved, false);
    }

    static ScheduleResult toResult(HospitalSchedule schedule, boolean hasCounselingRecord) {
        return new ScheduleResult(
                schedule.getId(),
                schedule.getHospitalName(),
                schedule.getScheduledAt(),
                schedule.getMemo(),
                schedule.getStatus() != null ? schedule.getStatus() : ScheduleStatus.SCHEDULED.name(),
                hasCounselingRecord
        );
    }
}
