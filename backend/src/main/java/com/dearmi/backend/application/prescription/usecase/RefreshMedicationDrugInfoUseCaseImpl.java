package com.dearmi.backend.application.prescription.usecase;

import com.dearmi.backend.application.prescription.service.PrescriptionMedDrugInfoService;
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
public class RefreshMedicationDrugInfoUseCaseImpl implements RefreshMedicationDrugInfoUseCase {

    private final PrescriptionMedicationRepository prescriptionMedicationRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionMedDrugInfoService prescriptionMedDrugInfoService;

    @Override
    @Transactional(readOnly = true)
    public void refresh(UUID userId, UUID medicationId) {
        PrescriptionMedication medication = prescriptionMedicationRepository.findById(medicationId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        // 소유권 검증
        prescriptionRepository
                .findByIdAndUserIdAndDeletedAtIsNull(medication.getPrescriptionId(), userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        prescriptionMedDrugInfoService.refreshAsync(medicationId);
    }
}
