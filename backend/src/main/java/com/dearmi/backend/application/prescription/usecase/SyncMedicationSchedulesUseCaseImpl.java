package com.dearmi.backend.application.prescription.usecase;

import com.dearmi.backend.application.medication.service.AutoCreateMedicationSchedulesService;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.prescription.Prescription;
import com.dearmi.backend.domain.prescription.PrescriptionMedication;
import com.dearmi.backend.domain.prescription.PrescriptionMedicationRepository;
import com.dearmi.backend.domain.prescription.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SyncMedicationSchedulesUseCaseImpl implements SyncMedicationSchedulesUseCase {

    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionMedicationRepository prescriptionMedicationRepository;
    private final AutoCreateMedicationSchedulesService autoCreateMedicationSchedulesService;

    @Override
    @Transactional
    public SyncResult sync(UUID userId, UUID prescriptionId) {
        // ④ 원칙: 소유권 검증 — 불일치 시 404
        Prescription prescription = prescriptionRepository
                .findByIdAndUserIdAndDeletedAtIsNull(prescriptionId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        List<PrescriptionMedication> medications =
                prescriptionMedicationRepository.findByPrescriptionId(prescriptionId);

        int created = autoCreateMedicationSchedulesService.autoCreate(
                userId, prescriptionId, prescription.getPrescribedAt(), medications);

        return new SyncResult(created, medications.size());
    }
}
