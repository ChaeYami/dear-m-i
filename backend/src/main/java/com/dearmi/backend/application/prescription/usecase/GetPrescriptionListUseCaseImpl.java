package com.dearmi.backend.application.prescription.usecase;

import com.dearmi.backend.application.prescription.dto.MedicationResult;
import com.dearmi.backend.application.prescription.dto.PrescriptionResult;
import com.dearmi.backend.application.record.dto.PageResult;
import com.dearmi.backend.domain.prescription.Prescription;
import com.dearmi.backend.domain.prescription.PrescriptionMedication;
import com.dearmi.backend.domain.prescription.PrescriptionMedicationRepository;
import com.dearmi.backend.domain.prescription.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GetPrescriptionListUseCaseImpl implements GetPrescriptionListUseCase {

    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionMedicationRepository prescriptionMedicationRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResult<PrescriptionResult> getList(UUID userId, int page, int size) {
        int offset = page * size;
        List<Prescription> prescriptions = prescriptionRepository.findPageByUserId(userId, offset, size);
        long total = prescriptionRepository.countByUserId(userId);

        List<UUID> prescriptionIds = prescriptions.stream().map(Prescription::getId).toList();
        Map<UUID, List<MedicationResult>> medicationsByPrescriptionId =
                prescriptionMedicationRepository.findByPrescriptionIdIn(prescriptionIds)
                        .stream()
                        .collect(Collectors.groupingBy(
                                PrescriptionMedication::getPrescriptionId,
                                Collectors.mapping(MedicationResult::from, Collectors.toList())
                        ));

        List<PrescriptionResult> content = prescriptions.stream()
                .map(p -> new PrescriptionResult(
                        p.getId(),
                        p.getScheduleId(),
                        p.getS3Key(),
                        p.getOcrStatus(),
                        p.getHospitalName(),
                        p.getPrescribedAt(),
                        medicationsByPrescriptionId.getOrDefault(p.getId(), List.of()),
                        null  // 목록에서는 presigned URL 미생성
                ))
                .toList();

        return PageResult.of(content, page, size, total);
    }
}
