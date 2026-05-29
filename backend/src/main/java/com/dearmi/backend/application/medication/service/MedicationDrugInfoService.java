package com.dearmi.backend.application.medication.service;

import com.dearmi.backend.application.druginfo.dto.DrugInfoDto;
import com.dearmi.backend.application.druginfo.service.DrugInfoRouter;
import com.dearmi.backend.domain.medication.MedicationScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * 복약 일정 생성 후 비동기로 허가정보 API 약품 정보를 조회하여 캐시.
 * OcrProcessorService와 동일한 패턴 — self-invocation 방지를 위해 별도 빈.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MedicationDrugInfoService {

    private final MedicationScheduleRepository medicationScheduleRepository;
    private final DrugInfoRouter drugInfoRouter;

    @Async("ocrTaskExecutor")
    @Transactional
    public void fetchDrugInfoAsync(UUID scheduleId, UUID userId) {
        fetchAndSave(scheduleId, userId, false);
    }

    /** 강제 재조회 (이미 조회된 약도 갱신) */
    @Async("ocrTaskExecutor")
    @Transactional
    public void fetchDrugInfoForce(UUID scheduleId, UUID userId) {
        fetchAndSave(scheduleId, userId, true);
    }

    private void fetchAndSave(UUID scheduleId, UUID userId, boolean force) {
        // ④ 원칙: async 진입점에서도 ownership 재검증
        var schedule = medicationScheduleRepository
                .findByIdAndUserIdAndDeletedAtIsNull(scheduleId, userId).orElse(null);
        if (schedule == null) return;
        if (!force && schedule.getDrugInfoFetchedAt() != null) return;

        try {
            Optional<DrugInfoDto> info = drugInfoRouter.searchByName(schedule.getDrugName(), schedule.getRegion());
            if (info.isPresent()) {
                schedule.updateDrugInfo(info.get().effect(), info.get().usage(), info.get().caution(), null, info.get().manufacturer(), info.get().itemSeq());
                log.info("약품 정보 저장 완료: scheduleId={}, drugName={}", scheduleId, schedule.getDrugName());
            } else {
                schedule.updateDrugInfo(null, null, null, null, null, null);
                log.info("약품 정보 미발견: scheduleId={}, drugName={}", scheduleId, schedule.getDrugName());
            }
            medicationScheduleRepository.save(schedule);
        } catch (Exception e) {
            schedule.updateDrugInfo(null, null, null, null, null, null);
            medicationScheduleRepository.save(schedule);
            log.warn("약품 정보 조회 실패: scheduleId={}, error={}", scheduleId, e.getMessage());
        }
    }
}
