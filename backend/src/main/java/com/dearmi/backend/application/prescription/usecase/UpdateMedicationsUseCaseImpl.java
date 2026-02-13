package com.dearmi.backend.application.prescription.usecase;

import com.dearmi.backend.application.prescription.dto.MedicationResult;
import com.dearmi.backend.application.prescription.dto.PrescriptionResult;
import com.dearmi.backend.application.prescription.dto.UpdateMedicationsCommand;
import com.dearmi.backend.application.prescription.port.StoragePort;
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
public class UpdateMedicationsUseCaseImpl implements UpdateMedicationsUseCase {

    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionMedicationRepository prescriptionMedicationRepository;
    private final StoragePort storagePort;

    @Override
    @Transactional
    public PrescriptionResult update(UpdateMedicationsCommand command) {
        Prescription prescription = prescriptionRepository
                .findByIdAndUserIdAndDeletedAtIsNull(command.prescriptionId(), command.userId())
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        // 기존 medications 전체 삭제 후 재등록
        prescriptionMedicationRepository.deleteByPrescriptionId(command.prescriptionId());

        List<MedicationResult> saved = command.medications().stream()
                .map(item -> PrescriptionMedication.builder()
                        .prescriptionId(command.prescriptionId())
                        .drugName(item.drugName())
                        .dosage(item.dosage())
                        .singleDose(item.singleDose())
                        .directions(item.directions())
                        .days(item.days())
                        .build())
                .map(prescriptionMedicationRepository::save)
                .map(MedicationResult::from)
                .toList();

        String imageUrl = prescription.getS3Key() != null
                ? storagePort.generateGetPresignedUrl(prescription.getS3Key())
                : null;

        return new PrescriptionResult(
                prescription.getId(),
                prescription.getScheduleId(),
                prescription.getS3Key(),
                prescription.getOcrStatus(),
                prescription.getPrescribedAt(),
                saved,
                imageUrl
        );
    }
}
