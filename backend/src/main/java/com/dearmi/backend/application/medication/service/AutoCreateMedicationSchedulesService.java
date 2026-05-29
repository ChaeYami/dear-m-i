package com.dearmi.backend.application.medication.service;

import com.dearmi.backend.domain.druginfo.DrugRegion;
import com.dearmi.backend.domain.medication.MedicationSchedule;
import com.dearmi.backend.domain.medication.MedicationScheduleRepository;
import com.dearmi.backend.domain.prescription.PrescriptionMedication;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 처방전 등록 시 처방 약품 목록을 자동으로 복약 일정에 등록.
 *
 * 호출 지점:
 *  - {@link com.dearmi.backend.application.prescription.service.OcrProcessorService} OCR 완료 후
 *  - {@link com.dearmi.backend.application.prescription.usecase.UpdateMedicationsUseCaseImpl} 사용자가 처방전 저장 시
 *
 * idempotency: 동일 처방전 + 동일 약품명으로 이미 활성 일정이 있으면 스킵.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AutoCreateMedicationSchedulesService {

    private final MedicationScheduleRepository medicationScheduleRepository;
    private final MedicationDrugInfoService medicationDrugInfoService;

    private static final LocalTime DEFAULT_MORNING_TIME = LocalTime.of(8, 0);
    private static final LocalTime DEFAULT_AFTERNOON_TIME = LocalTime.of(13, 0);
    private static final LocalTime DEFAULT_EVENING_TIME = LocalTime.of(18, 0);
    private static final LocalTime DEFAULT_BEDTIME = LocalTime.of(22, 0);
    private static final Pattern TIMES_PER_DAY = Pattern.compile("(?:1\\s*일|하루)\\s*(\\d)\\s*회");

    public int autoCreate(
            UUID userId,
            UUID prescriptionId,
            LocalDate prescribedAt,
            DrugRegion region,
            List<PrescriptionMedication> medications
    ) {
        if (medications == null || medications.isEmpty()) return 0;

        // 이미 같은 처방전 + 같은 약품명으로 등록된 일정은 스킵 (사용자 커스터마이즈 보존)
        Set<String> existingDrugNames = new HashSet<>();
        for (MedicationSchedule existing : medicationScheduleRepository.findByPrescriptionIdAndDeletedAtIsNull(prescriptionId)) {
            if (existing.getDrugName() != null) {
                existingDrugNames.add(existing.getDrugName().trim().toLowerCase());
            }
        }

        LocalDate startDate = prescribedAt != null ? prescribedAt : LocalDate.now();

        int created = 0;
        for (PrescriptionMedication med : medications) {
            String drugName = med.getDrugName();
            if (drugName == null || drugName.isBlank()) continue;
            if (existingDrugNames.contains(drugName.trim().toLowerCase())) continue;

            SlotConfig slots = parseDirections(med.getDirections());

            Short days = med.getDays();
            LocalDate endDate = (days != null && days > 0) ? startDate.plusDays(days - 1L) : null;

            MedicationSchedule schedule = MedicationSchedule.builder()
                    .userId(userId)
                    .prescriptionId(prescriptionId)
                    .prescriptionMedicationId(med.getId())
                    .drugName(drugName)
                    .dosage(med.getDosage())
                    .singleDose(med.getSingleDose())
                    .region(region)
                    .startDate(startDate)
                    .endDate(endDate)
                    .morning(slots.morning)
                    .afternoon(slots.afternoon)
                    .evening(slots.evening)
                    .bedtime(slots.bedtime)
                    .morningTime(slots.morning ? DEFAULT_MORNING_TIME : null)
                    .afternoonTime(slots.afternoon ? DEFAULT_AFTERNOON_TIME : null)
                    .eveningTime(slots.evening ? DEFAULT_EVENING_TIME : null)
                    .bedtimeTime(slots.bedtime ? DEFAULT_BEDTIME : null)
                    .build();

            MedicationSchedule saved = medicationScheduleRepository.save(schedule);
            existingDrugNames.add(drugName.trim().toLowerCase());

            medicationDrugInfoService.fetchDrugInfoAsync(saved.getId(), userId);
            // drugName 로깅 금지 (PII)
            log.info("처방전 → 복약 일정 자동 등록: scheduleId={}", saved.getId());
            created++;
        }
        return created;
    }

    private SlotConfig parseDirections(String directions) {
        if (directions == null || directions.isBlank()) return SlotConfig.MORNING_ONLY;

        String lower = directions.toLowerCase();
        if (directions.contains("취침") || lower.contains("bedtime")) {
            return new SlotConfig(false, false, false, true);
        }

        Matcher m = TIMES_PER_DAY.matcher(directions);
        if (m.find()) {
            try {
                int n = Integer.parseInt(m.group(1));
                return switch (n) {
                    case 1 -> SlotConfig.MORNING_ONLY;
                    case 2 -> new SlotConfig(true, false, true, false);
                    case 3 -> new SlotConfig(true, true, true, false);
                    case 4 -> new SlotConfig(true, true, true, true);
                    default -> SlotConfig.MORNING_ONLY;
                };
            } catch (NumberFormatException ignored) {}
        }
        return SlotConfig.MORNING_ONLY;
    }

    private record SlotConfig(boolean morning, boolean afternoon, boolean evening, boolean bedtime) {
        static final SlotConfig MORNING_ONLY = new SlotConfig(true, false, false, false);
    }
}
