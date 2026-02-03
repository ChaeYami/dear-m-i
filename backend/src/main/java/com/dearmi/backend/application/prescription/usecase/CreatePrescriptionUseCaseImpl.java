package com.dearmi.backend.application.prescription.usecase;

import com.dearmi.backend.application.prescription.dto.CreatePrescriptionCommand;
import com.dearmi.backend.application.prescription.service.OcrProcessorService;
import com.dearmi.backend.domain.prescription.Prescription;
import com.dearmi.backend.domain.prescription.PrescriptionRepository;
import com.dearmi.backend.domain.subscription.SubscriptionPlan;
import com.dearmi.backend.infrastructure.security.PlanRequired;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CreatePrescriptionUseCaseImpl implements CreatePrescriptionUseCase {

    private final PrescriptionRepository prescriptionRepository;
    private final OcrProcessorService ocrProcessorService;

    @Override
    @PlanRequired(SubscriptionPlan.PREMIUM)
    @Transactional
    public UUID create(CreatePrescriptionCommand command) {
        Prescription prescription = Prescription.builder()
                .userId(command.userId())
                .s3Key(command.s3Key())
                .scheduleId(command.scheduleId())
                .prescribedAt(command.prescribedAt())
                .build();

        Prescription saved = prescriptionRepository.save(prescription);

        // @Async: 트랜잭션 커밋 후 별도 스레드에서 OCR 처리
        ocrProcessorService.processAsync(saved.getId(), saved.getS3Key());

        return saved.getId();
    }
}
