package com.dearmi.backend.application.medication.service;

import com.dearmi.backend.application.druginfo.dto.DrugInfoDto;
import com.dearmi.backend.application.druginfo.port.DrugInfoPort;
import com.dearmi.backend.domain.medication.MedicationScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * 복약 일정 생성 후 비동기로 e약은요 약품 정보를 조회하여 캐시.
 * OcrProcessorService와 동일한 패턴 — self-invocation 방지를 위해 별도 빈.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MedicationDrugInfoService {

    private final MedicationScheduleRepository medicationScheduleRepository;
    private final DrugInfoPort drugInfoPort;

    @Async("ocrTaskExecutor")
    @Transactional
    public void fetchDrugInfoAsync(UUID scheduleId) {
        fetchAndSave(scheduleId, false);
    }

    /** 강제 재조회 (이미 조회된 약도 갱신) */
    @Async("ocrTaskExecutor")
    @Transactional
    public void fetchDrugInfoForce(UUID scheduleId) {
        fetchAndSave(scheduleId, true);
    }

    private void fetchAndSave(UUID scheduleId, boolean force) {
        var schedule = medicationScheduleRepository.findById(scheduleId).orElse(null);
        if (schedule == null) return;
        if (!force && schedule.getDrugInfoFetchedAt() != null) return;

        try {
            Optional<DrugInfoDto> info = drugInfoPort.searchByName(schedule.getDrugName());
            if (info.isPresent()) {
                schedule.updateDrugInfo(info.get().effect(), info.get().usage(), info.get().caution(), info.get().manufacturer(), info.get().itemSeq());
                log.info("약품 정보 저장 완료: scheduleId={}, drugName={}", scheduleId, schedule.getDrugName());
            } else {
                schedule.updateDrugInfo(null, null, null, null, null);
                log.info("약품 정보 미발견: scheduleId={}, drugName={}", scheduleId, schedule.getDrugName());
            }
            medicationScheduleRepository.save(schedule);
        } catch (Exception e) {
            schedule.updateDrugInfo(null, null, null, null, null);
            medicationScheduleRepository.save(schedule);
            log.warn("약품 정보 조회 실패: scheduleId={}, error={}", scheduleId, e.getMessage());
        }
    }
}
