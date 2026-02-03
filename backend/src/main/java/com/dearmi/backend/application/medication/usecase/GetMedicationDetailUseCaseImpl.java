package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.application.medication.dto.MedicationDetailResult;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.prescription.PrescriptionMedication;
import com.dearmi.backend.domain.prescription.PrescriptionMedicationRepository;
import com.dearmi.backend.domain.prescription.PrescriptionRepository;
import com.dearmi.backend.domain.subscription.SubscriptionPlan;
import com.dearmi.backend.infrastructure.security.PlanRequired;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetMedicationDetailUseCaseImpl implements GetMedicationDetailUseCase {

    private final PrescriptionMedicationRepository prescriptionMedicationRepository;
    private final PrescriptionRepository prescriptionRepository;

    @Override
    @PlanRequired(SubscriptionPlan.PREMIUM)
    @Transactional(readOnly = true)
    public MedicationDetailResult getDetail(UUID userId, UUID medicationId) {
        PrescriptionMedication medication = prescriptionMedicationRepository
                .findById(medicationId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        // ④ 원칙: 처방전 소유자 확인 (불일치 시 404 반환)
        prescriptionRepository
                .findByIdAndUserIdAndDeletedAtIsNull(medication.getPrescriptionId(), userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        return MedicationDetailResult.from(medication);
    }
}
