package com.dearmi.backend.application.prescription.service;

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

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OcrProcessorService {

    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionMedicationRepository prescriptionMedicationRepository;
    private final PrescriptionOcrPort prescriptionOcrPort;

    /**
     * @Async: 처방전 저장 트랜잭션 커밋 후 별도 스레드에서 OCR 처리
     * 성공: status → COMPLETED + medications 저장
     * 실패: status → FAILED
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

        try {
            prescription.startOcr();
            prescriptionRepository.save(prescription);

            List<OcrMedicationItem> items = prescriptionOcrPort.analyze(s3Key);

            items.forEach(item -> prescriptionMedicationRepository.save(
                    PrescriptionMedication.builder()
                            .prescriptionId(prescriptionId)
                            .drugName(item.drugName())
                            .dosage(item.dosage())
                            .directions(item.directions())
                            .days(item.days())
                            .build()
            ));

            prescription.completeOcr(null); // rawText 저장 불필요 시 null
            prescriptionRepository.save(prescription);
            log.info("OCR 완료: prescriptionId={}, 약품={}건", prescriptionId, items.size());

        } catch (PrescriptionOcrException e) {
            log.error("OCR 실패: prescriptionId={}", prescriptionId, e);
            prescription.failOcr();
            prescriptionRepository.save(prescription);
        }
    }
}
