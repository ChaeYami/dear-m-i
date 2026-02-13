package com.dearmi.backend.application.prescription.usecase;

import com.dearmi.backend.application.prescription.dto.CreatePrescriptionCommand;
import com.dearmi.backend.application.prescription.service.OcrProcessorService;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.prescription.Prescription;
import com.dearmi.backend.domain.prescription.PrescriptionRepository;
import com.dearmi.backend.domain.subscription.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CreatePrescriptionUseCaseImpl implements CreatePrescriptionUseCase {

    private static final int FREE_WEEKLY_LIMIT = 1;

    private final PrescriptionRepository prescriptionRepository;
    private final OcrProcessorService ocrProcessorService;
    private final SubscriptionRepository subscriptionRepository;

    @Override
    @Transactional
    public UUID create(CreatePrescriptionCommand command) {
        boolean isPremium = subscriptionRepository.findByUserId(command.userId())
                .map(s -> s.isPremium())
                .orElse(false);

        if (!isPremium) {
            // FREE 플랜: 최근 7일 이내 등록 수 확인
            LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
            long recentCount = prescriptionRepository.countRecentByUserId(command.userId(), weekAgo);
            if (recentCount >= FREE_WEEKLY_LIMIT) {
                throw new CustomException(ErrorCode.PLAN_REQUIRED);
            }
        }

        Prescription prescription = Prescription.builder()
                .userId(command.userId())
                .s3Key(command.s3Key())
                .scheduleId(command.scheduleId())
                .prescribedAt(command.prescribedAt())
                .build();

        Prescription saved = prescriptionRepository.save(prescription);

        // 트랜잭션 커밋 완료 후 OCR 시작 — 커밋 전 @Async 호출 시 DB에서 처방전을 찾지 못하는 문제 방지
        UUID prescriptionId = saved.getId();
        String s3Key = saved.getS3Key();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                ocrProcessorService.processAsync(prescriptionId, s3Key);
            }
        });

        return prescriptionId;
    }
}
