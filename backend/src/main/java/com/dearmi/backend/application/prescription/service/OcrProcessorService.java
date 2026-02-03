package com.dearmi.backend.application.prescription.service;

import com.dearmi.backend.application.druginfo.dto.DrugInfoDto;
import com.dearmi.backend.application.druginfo.service.DrugInfoCacheService;
import com.dearmi.backend.application.prescription.dto.OcrMedicationItem;
import com.dearmi.backend.application.prescription.port.PrescriptionOcrPort;
import com.dearmi.backend.common.exception.PrescriptionOcrException;
import com.dearmi.backend.domain.prescription.Prescription;
import com.dearmi.backend.domain.prescription.PrescriptionMedication;
import com.dearmi.backend.domain.prescription.PrescriptionMedicationRepository;
import com.dearmi.backend.domain.prescription.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OcrProcessorService {

    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionMedicationRepository prescriptionMedicationRepository;
    private final PrescriptionOcrPort prescriptionOcrPort;
    private final DrugInfoCacheService drugInfoCacheService;

    /**
     * @Async: 처방전 저장 트랜잭션 커밋 후 별도 스레드에서 처리
     * 1. OCR → medications 저장 → COMPLETED
     * 2. 각 medication에 대해 DrugInfoCacheService로 약품 정보 보강
     */
    @Async("ocrTaskExecutor")
    @Transactional
    public void processAsync(UUID prescriptionId, String s3Key) {
        Prescription prescription = prescriptionRepository
                .findById(prescriptionId)
                .orElseGet(() -> {
                    log.warn("OCR 대상 처방전을 찾을 수 없음: prescriptionId={}", prescriptionId);
                    return null;
                });

        if (prescription == null) return;

        List<PrescriptionMedication> savedMedications = new ArrayList<>();

        try {
            prescription.startOcr();
            prescriptionRepository.save(prescription);

            List<OcrMedicationItem> items = prescriptionOcrPort.analyze(s3Key);

            items.forEach(item -> {
                PrescriptionMedication med = prescriptionMedicationRepository.save(
                        PrescriptionMedication.builder()
                                .prescriptionId(prescriptionId)
                                .drugName(item.drugName())
                                .dosage(item.dosage())
                                .directions(item.directions())
                                .days(item.days())
                                .build()
                );
                savedMedications.add(med);
            });

            prescription.completeOcr(null);
            prescriptionRepository.save(prescription);
            log.info("OCR 완료: prescriptionId={}, 약품={}건", prescriptionId, items.size());

        } catch (PrescriptionOcrException e) {
            log.error("OCR 실패: prescriptionId={}", prescriptionId, e);
            prescription.failOcr();
            prescriptionRepository.save(prescription);
            return;
        }

        // OCR 완료 후 약품 정보 보강 (DrugInfoCacheService — 실패해도 OCR 결과에 영향 없음)
        savedMedications.forEach(med -> {
            try {
                Optional<DrugInfoDto> drugInfo = drugInfoCacheService.searchWithCache(med.getDrugName());
                drugInfo.ifPresent(info -> {
                    med.updateDrugInfo(info.effect(), info.caution(), info.manufacturer());
                    prescriptionMedicationRepository.save(med);
                });
            } catch (Exception e) {
                log.warn("약품 정보 조회 실패 (무시): drugName={}, error={}", med.getDrugName(), e.getMessage());
            }
        });
    }
}
