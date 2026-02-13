package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.application.medication.dto.CreateMedicationScheduleCommand;
import com.dearmi.backend.application.medication.dto.MedicationScheduleResult;
import com.dearmi.backend.application.medication.service.MedicationDrugInfoService;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.medication.MedicationSchedule;
import com.dearmi.backend.domain.medication.MedicationScheduleRepository;
import com.dearmi.backend.domain.prescription.PrescriptionMedication;
import com.dearmi.backend.domain.prescription.PrescriptionMedicationRepository;
import com.dearmi.backend.domain.prescription.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CreateMedicationScheduleUseCaseImpl implements CreateMedicationScheduleUseCase {

    private final MedicationScheduleRepository medicationScheduleRepository;
    private final PrescriptionMedicationRepository prescriptionMedicationRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicationDrugInfoService medicationDrugInfoService;

    @Override
    @Transactional
    public MedicationScheduleResult create(CreateMedicationScheduleCommand command) {
        // prescriptionMedicationId 있으면 소유권 검증 (④ 원칙) + 약품 정보 pre-fill
        String resolvedDrugName = command.drugName();
        String resolvedDosage = command.dosage();
        String resolvedSingleDose = command.singleDose();
        java.util.UUID resolvedPrescriptionId = null;

        if (command.prescriptionMedicationId() != null) {
            PrescriptionMedication pm = prescriptionMedicationRepository
                    .findById(command.prescriptionMedicationId())
                    .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

            // 처방전 소유자 확인 — 불일치 시 404 (리소스 존재 여부 숨김)
            var prescription = prescriptionRepository
                    .findByIdAndUserIdAndDeletedAtIsNull(pm.getPrescriptionId(), command.userId())
                    .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

            resolvedPrescriptionId = prescription.getId();
            if (resolvedDrugName == null || resolvedDrugName.isBlank()) {
                resolvedDrugName = pm.getDrugName();
            }
            if (resolvedDosage == null || resolvedDosage.isBlank()) {
                resolvedDosage = pm.getDosage();
            }
            if (resolvedSingleDose == null || resolvedSingleDose.isBlank()) {
                resolvedSingleDose = pm.getSingleDose();
            }
        }

        if (resolvedDrugName == null || resolvedDrugName.isBlank()) {
            throw new CustomException(ErrorCode.INVALID_REQUEST, "약품명은 필수입니다.");
        }

        MedicationSchedule schedule = MedicationSchedule.builder()
                .userId(command.userId())
                .prescriptionId(resolvedPrescriptionId)
                .prescriptionMedicationId(command.prescriptionMedicationId())
                .drugName(resolvedDrugName)
                .dosage(resolvedDosage)
                .singleDose(resolvedSingleDose)
                .drugCategory(command.drugCategory())
                .timesPerDay(command.timesPerDay())
                .startDate(command.startDate())
                .endDate(command.endDate())
                .morning(command.morning())
                .afternoon(command.afternoon())
                .evening(command.evening())
                .bedtime(command.bedtime())
                .morningTime(command.morningTime())
                .afternoonTime(command.afternoonTime())
                .eveningTime(command.eveningTime())
                .bedtimeTime(command.bedtimeTime())
                .build();

        MedicationSchedule saved = medicationScheduleRepository.save(schedule);

        // 비동기로 e약은요 약품 정보 조회 → 캐시 저장
        medicationDrugInfoService.fetchDrugInfoAsync(saved.getId());

        return MedicationScheduleResult.from(saved);
    }
}
