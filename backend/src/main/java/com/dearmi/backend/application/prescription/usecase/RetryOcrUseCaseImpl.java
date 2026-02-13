package com.dearmi.backend.application.prescription.usecase;

import com.dearmi.backend.application.prescription.service.OcrProcessorService;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.prescription.Prescription;
import com.dearmi.backend.domain.prescription.PrescriptionMedicationRepository;
import com.dearmi.backend.domain.prescription.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RetryOcrUseCaseImpl implements RetryOcrUseCase {

    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionMedicationRepository prescriptionMedicationRepository;
    private final OcrProcessorService ocrProcessorService;

    @Override
    @Transactional
    public void retry(UUID userId, UUID prescriptionId) {
        Prescription prescription = prescriptionRepository
                .findByIdAndUserIdAndDeletedAtIsNull(prescriptionId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        // 상태 무관하게 강제 재시작 — PENDING/PROCESSING 인 채로 Gemini 가 hang 한 좀비 케이스 대응.
        // 기존 비동기 태스크가 진행 중일 수 있으나, 완료되더라도 본 재시도가 덮어쓴다.
        prescriptionMedicationRepository.deleteByPrescriptionId(prescriptionId);
        prescription.resetForRetry();
        prescriptionRepository.save(prescription);

        String s3Key = prescription.getS3Key();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                ocrProcessorService.processAsync(prescriptionId, s3Key);
            }
        });
    }
}
