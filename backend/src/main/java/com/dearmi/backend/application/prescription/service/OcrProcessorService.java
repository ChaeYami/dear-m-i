package com.dearmi.backend.application.prescription.service;

import com.dearmi.backend.application.druginfo.dto.DrugInfoDto;
import com.dearmi.backend.application.druginfo.service.DrugInfoCacheService;
import com.dearmi.backend.application.prescription.dto.OcrMedicationItem;
import com.dearmi.backend.application.prescription.dto.OcrResult;
import com.dearmi.backend.application.prescription.port.PrescriptionOcrPort;
import com.dearmi.backend.common.exception.PrescriptionOcrException;
import com.dearmi.backend.domain.prescription.Prescription;
import com.dearmi.backend.domain.prescription.PrescriptionMedication;
import com.dearmi.backend.domain.prescription.PrescriptionMedicationRepository;
import com.dearmi.backend.domain.prescription.PrescriptionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Slf4j
@Service
public class OcrProcessorService {

    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionMedicationRepository prescriptionMedicationRepository;
    private final PrescriptionOcrPort prescriptionOcrPort;
    private final DrugInfoCacheService drugInfoCacheService;
    private final TransactionTemplate transactionTemplate;
    private final Executor taskExecutor;

    public OcrProcessorService(
            PrescriptionRepository prescriptionRepository,
            PrescriptionMedicationRepository prescriptionMedicationRepository,
            PrescriptionOcrPort prescriptionOcrPort,
            DrugInfoCacheService drugInfoCacheService,
            PlatformTransactionManager txManager,
            @Qualifier("ocrTaskExecutor") Executor taskExecutor) {
        this.prescriptionRepository = prescriptionRepository;
        this.prescriptionMedicationRepository = prescriptionMedicationRepository;
        this.prescriptionOcrPort = prescriptionOcrPort;
        this.drugInfoCacheService = drugInfoCacheService;
        this.transactionTemplate = new TransactionTemplate(txManager);
        this.taskExecutor = taskExecutor;
    }

    /**
     * @Async: 처방전 저장 트랜잭션 커밋 후 별도 스레드에서 처리.
     * 두 단계로 분리:
     *   1. OCR → medications 저장 → COMPLETED 상태 저장 → 즉시 커밋 (앱이 폴링으로 바로 감지)
     *   2. 드러그인포 조회: 약품별 병렬 실행 (실패해도 OCR 결과에 영향 없음)
     */
    @Async("ocrTaskExecutor")
    public void processAsync(UUID prescriptionId, String s3Key) {
        log.info("OCR 시작: prescriptionId={}, s3Key={}", prescriptionId, s3Key);
        // ── 1단계: OCR + 결과 저장 (트랜잭션 즉시 커밋) ─────────────────────────
        List<PrescriptionMedication> savedMedications = new ArrayList<>();

        boolean ocrSucceeded = Boolean.TRUE.equals(transactionTemplate.execute(status -> {
            Prescription prescription = prescriptionRepository.findById(prescriptionId).orElse(null);
            if (prescription == null) {
                log.warn("OCR 대상 처방전을 찾을 수 없음: prescriptionId={}", prescriptionId);
                return false;
            }

            try {
                prescription.startOcr();
                prescriptionRepository.save(prescription);

                OcrResult ocrResult = prescriptionOcrPort.analyze(s3Key);
                List<OcrMedicationItem> items = ocrResult.medications();

                log.info("OCR 파싱: hospitalName={}, prescribedAt={}, 약품={}건",
                        ocrResult.hospitalName(), ocrResult.prescribedAt(), items.size());

                LocalDate parsedDate = null;
                try {
                    if (ocrResult.prescribedAt() != null) parsedDate = LocalDate.parse(ocrResult.prescribedAt());
                } catch (Exception e) {
                    log.warn("처방일 파싱 실패: {}", ocrResult.prescribedAt());
                }
                prescription.updateFromOcr(ocrResult.hospitalName(), parsedDate);

                items.forEach(item -> {
                    log.info("OCR 약품: drugName={}, dosage={}, singleDose={}, directions={}, days={}",
                            item.drugName(), item.dosage(), item.singleDose(), item.directions(), item.days());
                    PrescriptionMedication med = prescriptionMedicationRepository.save(
                            PrescriptionMedication.builder()
                                    .prescriptionId(prescriptionId)
                                    .drugName(item.drugName())
                                    .dosage(item.dosage())
                                    .singleDose(item.singleDose())
                                    .directions(item.directions())
                                    .days(item.days())
                                    .build()
                    );
                    savedMedications.add(med);
                });

                prescription.completeOcr(null);
                prescriptionRepository.save(prescription);
                log.info("OCR 완료: prescriptionId={}, 약품={}건", prescriptionId, items.size());
                return true;

            } catch (PrescriptionOcrException e) {
                log.error("OCR 실패: prescriptionId={}", prescriptionId, e);
                Prescription p = prescriptionRepository.findById(prescriptionId).orElse(null);
                if (p != null) { p.failOcr(); prescriptionRepository.save(p); }
                return false;
            }
        }));

        if (!ocrSucceeded || savedMedications.isEmpty()) return;

        // ── 2단계: 약품 정보 보강 (COMPLETED 커밋 후 병렬 실행) ─────────────────
        List<CompletableFuture<Void>> futures = savedMedications.stream()
                .map(med -> CompletableFuture.runAsync(() -> {
                    try {
                        Optional<DrugInfoDto> drugInfo = drugInfoCacheService.searchWithCache(med.getDrugName());
                        drugInfo.ifPresent(info -> transactionTemplate.execute(s -> {
                            med.updateDrugInfo(info.effect(), info.caution(), info.manufacturer());
                            prescriptionMedicationRepository.save(med);
                            return null;
                        }));
                    } catch (Exception e) {
                        log.warn("약품 정보 조회 실패 (무시): drugName={}, error={}", med.getDrugName(), e.getMessage());
                    }
                }, taskExecutor))
                .toList();

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        log.info("약품 정보 보강 완료: prescriptionId={}", prescriptionId);
    }
}
