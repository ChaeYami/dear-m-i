package com.dearmi.backend.application.prescription.service;

import com.dearmi.backend.application.druginfo.dto.DrugInfoDto;
import com.dearmi.backend.application.druginfo.port.DrugInfoPort;
import com.dearmi.backend.domain.prescription.PrescriptionMedicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * 처방 약품의 e약은요 정보를 비동기로 갱신.
 * self-invocation 방지를 위해 별도 빈으로 분리.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PrescriptionMedDrugInfoService {

    private final PrescriptionMedicationRepository prescriptionMedicationRepository;
    private final DrugInfoPort drugInfoPort;

    @Async("ocrTaskExecutor")
    @Transactional
    public void refreshAsync(UUID medicationId) {
        var med = prescriptionMedicationRepository.findById(medicationId).orElse(null);
        if (med == null) return;

        try {
            Optional<DrugInfoDto> info = drugInfoPort.searchByName(med.getDrugName());
            if (info.isPresent()) {
                med.updateDrugInfo(info.get().effect(), info.get().caution(), info.get().manufacturer());
                log.info("처방 약품 정보 갱신 완료: medicationId={}, drugName={}", medicationId, med.getDrugName());
            } else {
                med.updateDrugInfo(null, null, null);
                log.info("처방 약품 정보 미발견: medicationId={}, drugName={}", medicationId, med.getDrugName());
            }
            prescriptionMedicationRepository.save(med);
        } catch (Exception e) {
            log.warn("처방 약품 정보 조회 실패: medicationId={}, error={}", medicationId, e.getMessage());
        }
    }
}
