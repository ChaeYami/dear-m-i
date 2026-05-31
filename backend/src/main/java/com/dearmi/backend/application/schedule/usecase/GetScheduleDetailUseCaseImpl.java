package com.dearmi.backend.application.schedule.usecase;

import com.dearmi.backend.application.schedule.dto.ScheduleResult;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.record.CounselingRecordRepository;
import com.dearmi.backend.domain.schedule.HospitalSchedule;
import com.dearmi.backend.domain.schedule.HospitalScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetScheduleDetailUseCaseImpl implements GetScheduleDetailUseCase {

    private final HospitalScheduleRepository hospitalScheduleRepository;
    private final CounselingRecordRepository counselingRecordRepository;

    @Override
    @Transactional(readOnly = true)
    public ScheduleResult getDetail(UUID userId, UUID scheduleId) {
        // ④ 원칙: userId 검증 포함 조회, 타인 리소스 → 404
        HospitalSchedule schedule = hospitalScheduleRepository
                .findByIdAndUserIdAndDeletedAtIsNull(scheduleId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        boolean hasCounselingRecord =
                counselingRecordRepository.existsByScheduleIdAndDeletedAtIsNull(scheduleId);

        return CreateScheduleUseCaseImpl.toResult(schedule, hasCounselingRecord);
    }
}
