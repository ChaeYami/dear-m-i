package com.dearmi.backend.application.prescription.usecase;

import com.dearmi.backend.application.prescription.service.OcrProcessorService;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.prescription.OcrStatus;
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

        // PENDING/PROCESSING 중에는 이미 OCR이 실행 중이므로 재시도 불가
        String currentStatus = prescription.getOcrStatus();
        if (OcrStatus.PENDING.name().equals(currentStatus) || OcrStatus.PROCESSING.name().equals(currentStatus)) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }

        // 이전 OCR 결과(약품 목록) 삭제 후 상태 초기화
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
