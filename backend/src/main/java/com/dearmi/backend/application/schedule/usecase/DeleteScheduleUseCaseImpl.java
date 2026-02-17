package com.dearmi.backend.application.schedule.usecase;

import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.counseling.CounselingRecordRepository;
import com.dearmi.backend.domain.hospital.HospitalSchedule;
import com.dearmi.backend.domain.hospital.HospitalScheduleRepository;
import com.dearmi.backend.domain.notification.NotificationRepository;
import com.dearmi.backend.domain.prepnote.PrepNoteRepository;
import com.dearmi.backend.domain.prescription.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DeleteScheduleUseCaseImpl implements DeleteScheduleUseCase {

    private final HospitalScheduleRepository hospitalScheduleRepository;
    private final CounselingRecordRepository counselingRecordRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PrepNoteRepository prepNoteRepository;
    private final NotificationRepository notificationRepository;

    @Override
    @Transactional
    public void delete(UUID userId, UUID scheduleId) {
        // ④ 원칙: userId 검증 포함 조회
        HospitalSchedule schedule = hospitalScheduleRepository
                .findByIdAndUserIdAndDeletedAtIsNull(scheduleId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        // 소프트 딜리트
        schedule.softDelete();
        hospitalScheduleRepository.save(schedule);

        // ⑤ 원칙: 연관 데이터 schedule_id NULL 처리 (데이터 유지, 연결만 해제)
        counselingRecordRepository.detachSchedule(scheduleId);
        prescriptionRepository.detachSchedule(scheduleId);
        prepNoteRepository.detachSchedule(scheduleId);
        notificationRepository.clearResourceId(scheduleId);
    }
}
