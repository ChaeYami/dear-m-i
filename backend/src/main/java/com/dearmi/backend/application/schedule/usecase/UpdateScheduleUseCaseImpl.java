package com.dearmi.backend.application.schedule.usecase;

import com.dearmi.backend.application.schedule.dto.ScheduleResult;
import com.dearmi.backend.application.schedule.dto.UpdateScheduleCommand;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.record.CounselingRecordRepository;
import com.dearmi.backend.domain.schedule.HospitalSchedule;
import com.dearmi.backend.domain.schedule.HospitalScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UpdateScheduleUseCaseImpl implements UpdateScheduleUseCase {

    private final HospitalScheduleRepository hospitalScheduleRepository;
    private final CounselingRecordRepository counselingRecordRepository;

    @Override
    @Transactional
    public ScheduleResult update(UpdateScheduleCommand command) {
        // ④ 원칙: userId 검증 포함 조회, 없으면 404
        HospitalSchedule schedule = hospitalScheduleRepository
                .findByIdAndUserIdAndDeletedAtIsNull(command.scheduleId(), command.userId())
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        schedule.update(command.hospitalName(), command.scheduledAt(), command.memo());

        boolean hasCounselingRecord =
                counselingRecordRepository.existsByScheduleIdAndDeletedAtIsNull(command.scheduleId());

        return CreateScheduleUseCaseImpl.toResult(schedule, hasCounselingRecord);
    }
}
