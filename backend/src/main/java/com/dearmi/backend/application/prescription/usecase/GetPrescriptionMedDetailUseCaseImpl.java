package com.dearmi.backend.application.prescription.usecase;

import com.dearmi.backend.application.prescription.dto.MedicationDetailResult;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.prescription.PrescriptionMedication;
import com.dearmi.backend.domain.prescription.PrescriptionMedicationRepository;
import com.dearmi.backend.domain.prescription.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetPrescriptionMedDetailUseCaseImpl implements GetPrescriptionMedDetailUseCase {

    private final PrescriptionMedicationRepository prescriptionMedicationRepository;
    private final PrescriptionRepository prescriptionRepository;

    @Override
    @Transactional(readOnly = true)
    public MedicationDetailResult getDetail(UUID userId, UUID medicationId) {
        PrescriptionMedication medication = prescriptionMedicationRepository.findById(medicationId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        // 소유권 검증: 약품이 속한 처방전이 해당 유저 것인지 확인
        prescriptionRepository
                .findByIdAndUserIdAndDeletedAtIsNull(medication.getPrescriptionId(), userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        return MedicationDetailResult.from(medication);
    }
}
