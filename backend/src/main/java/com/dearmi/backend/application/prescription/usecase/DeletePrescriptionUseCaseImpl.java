package com.dearmi.backend.application.prescription.usecase;

import com.dearmi.backend.application.prescription.port.StoragePort;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.prescription.Prescription;
import com.dearmi.backend.domain.prescription.PrescriptionMedicationRepository;
import com.dearmi.backend.domain.prescription.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeletePrescriptionUseCaseImpl implements DeletePrescriptionUseCase {

    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionMedicationRepository prescriptionMedicationRepository;
    private final StoragePort storagePort;

    @Override
    @Transactional
    public void delete(UUID userId, UUID prescriptionId) {
        Prescription prescription = prescriptionRepository
                .findByIdAndUserIdAndDeletedAtIsNull(prescriptionId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        // ⑤ 원칙: prescription_medications CASCADE 삭제
        prescriptionMedicationRepository.deleteByPrescriptionId(prescriptionId);

        // ⑤ 원칙: S3 이미지 삭제 (실패해도 처방전 삭제는 계속)
        if (prescription.getS3Key() != null) {
            try {
                storagePort.deleteObject(prescription.getS3Key());
            } catch (Exception e) {
                log.warn("S3 이미지 삭제 실패 (prescriptionId={}): {}", prescriptionId, e.getMessage());
            }
        }

        prescription.softDelete();
    }
}
