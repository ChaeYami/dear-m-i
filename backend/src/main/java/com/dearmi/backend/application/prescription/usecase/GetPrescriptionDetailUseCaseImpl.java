package com.dearmi.backend.application.prescription.usecase;

import com.dearmi.backend.application.prescription.dto.MedicationResult;
import com.dearmi.backend.application.prescription.dto.PrescriptionResult;
import com.dearmi.backend.application.prescription.port.StoragePort;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.prescription.Prescription;
import com.dearmi.backend.domain.prescription.PrescriptionMedicationRepository;
import com.dearmi.backend.domain.prescription.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetPrescriptionDetailUseCaseImpl implements GetPrescriptionDetailUseCase {

    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionMedicationRepository prescriptionMedicationRepository;
    private final StoragePort storagePort;

    @Override
    @Transactional(readOnly = true)
    public PrescriptionResult getDetail(UUID userId, UUID prescriptionId) {
        Prescription prescription = prescriptionRepository
                .findByIdAndUserIdAndDeletedAtIsNull(prescriptionId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        List<MedicationResult> medications = prescriptionMedicationRepository
                .findByPrescriptionId(prescriptionId)
                .stream()
                .map(MedicationResult::from)
                .toList();

        // 이미지 URL은 GET Presigned URL로 반환 (직접 S3 URL 노출 금지)
        String imageUrl = prescription.getS3Key() != null
                ? storagePort.generateGetPresignedUrl(prescription.getS3Key())
                : null;

        return new PrescriptionResult(
                prescription.getId(),
                prescription.getScheduleId(),
                prescription.getS3Key(),
                prescription.getOcrStatus(),
                prescription.getPrescribedAt(),
                medications,
                imageUrl
        );
    }
}
