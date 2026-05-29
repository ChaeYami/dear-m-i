package com.dearmi.backend.application.prescription.service;

import com.dearmi.backend.application.druginfo.dto.DrugInfoDto;
import com.dearmi.backend.application.druginfo.service.DrugInfoRouter;
import com.dearmi.backend.domain.druginfo.DrugRegion;
import com.dearmi.backend.domain.prescription.PrescriptionMedicationRepository;
import com.dearmi.backend.domain.prescription.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * 처방 약품의 허가정보(식약처 의약품 제품 허가정보 API)를 비동기로 갱신.
 * self-invocation 방지를 위해 별도 빈으로 분리.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PrescriptionMedDrugInfoService {

    private final PrescriptionMedicationRepository prescriptionMedicationRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final DrugInfoRouter drugInfoRouter;

    @Async("ocrTaskExecutor")
    @Transactional
    public void refreshAsync(UUID medicationId, UUID userId) {
        var med = prescriptionMedicationRepository.findById(medicationId).orElse(null);
        if (med == null) return;
        // ④ 원칙: medication → prescription 의 ownership 재검증 (호출자 누락/오용 방어)
        if (prescriptionRepository
                .findByIdAndUserIdAndDeletedAtIsNull(med.getPrescriptionId(), userId).isEmpty()) {
            log.warn("약품 정보 갱신 거절 (ownership mismatch): medicationId={}, userId={}", medicationId, userId);
            return;
        }

        try {
            // TODO(global): med 의 처방전 region 사용 (현재 KR 하드코딩)
            Optional<DrugInfoDto> info = drugInfoRouter.searchByName(med.getDrugName(), DrugRegion.KR);
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
