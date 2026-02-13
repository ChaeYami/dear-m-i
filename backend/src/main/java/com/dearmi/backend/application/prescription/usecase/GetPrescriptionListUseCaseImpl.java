package com.dearmi.backend.application.prescription.usecase;

import com.dearmi.backend.application.prescription.dto.MedicationResult;
import com.dearmi.backend.application.prescription.dto.PrescriptionResult;
import com.dearmi.backend.application.record.dto.PageResult;
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
public class GetPrescriptionListUseCaseImpl implements GetPrescriptionListUseCase {

    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionMedicationRepository prescriptionMedicationRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResult<PrescriptionResult> getList(UUID userId, int page, int size) {
        int offset = page * size;
        List<Prescription> prescriptions = prescriptionRepository.findPageByUserId(userId, offset, size);
        long total = prescriptionRepository.countByUserId(userId);

        List<PrescriptionResult> content = prescriptions.stream()
                .map(p -> {
                    List<MedicationResult> medications = prescriptionMedicationRepository
                            .findByPrescriptionId(p.getId())
                            .stream()
                            .map(MedicationResult::from)
                            .toList();
                    return new PrescriptionResult(
                            p.getId(),
                            p.getScheduleId(),
                            p.getS3Key(),
                            p.getOcrStatus(),
                            p.getHospitalName(),
                            p.getPrescribedAt(),
                            medications,
                            null  // 목록에서는 presigned URL 미생성
                    );
                })
                .toList();

        return PageResult.of(content, page, size, total);
    }
}
