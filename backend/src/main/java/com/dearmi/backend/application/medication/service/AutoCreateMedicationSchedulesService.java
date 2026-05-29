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
        if (directions.contains("취침") || lower.contains("bedtime")
                || lower.contains("at night") || lower.contains("before bed") || lower.contains("qhs")) {
            return new SlotConfig(false, false, false, true);
        }

        // 한국어: "1일 N회" / "하루 N회"
        Matcher m = TIMES_PER_DAY.matcher(directions);
        if (m.find()) {
            try {
                return slotsForTimesPerDay(Integer.parseInt(m.group(1)));
            } catch (NumberFormatException ignored) {}
        }

        // 영문 Rx 빈도 표현 (once/twice/three times daily, b.i.d/t.i.d/q.i.d, every N hours)
        int en = parseEnglishTimesPerDay(lower);
        if (en > 0) return slotsForTimesPerDay(en);

        return SlotConfig.MORNING_ONLY;
    }

    private SlotConfig slotsForTimesPerDay(int n) {
        return switch (n) {
            case 1 -> SlotConfig.MORNING_ONLY;
            case 2 -> new SlotConfig(true, false, true, false);
            case 3 -> new SlotConfig(true, true, true, false);
            case 4 -> new SlotConfig(true, true, true, true);
            default -> SlotConfig.MORNING_ONLY;
        };
    }

    /** 영문 복약지시에서 1일 복용 횟수 추정. 미상이면 -1. 높은 빈도부터 검사. */
    private int parseEnglishTimesPerDay(String lower) {
        if (lower.contains("four times") || lower.contains("4 times")
                || lower.contains("qid") || lower.contains("q.i.d") || lower.contains("every 6 hours")) return 4;
        if (lower.contains("three times") || lower.contains("3 times")
                || lower.contains("tid") || lower.contains("t.i.d") || lower.contains("every 8 hours")) return 3;
        if (lower.contains("twice") || lower.contains("two times") || lower.contains("2 times")
                || lower.contains("bid") || lower.contains("b.i.d") || lower.contains("every 12 hours")) return 2;
        if (lower.contains("once") || lower.contains("1 time") || lower.contains("one time")
                || lower.contains("daily") || lower.contains("once a day") || lower.contains("once daily")
                || lower.contains("every day") || lower.contains("qd") || lower.contains("q.d")) return 1;
        return -1;
    }

    private record SlotConfig(boolean morning, boolean afternoon, boolean evening, boolean bedtime) {
        static final SlotConfig MORNING_ONLY = new SlotConfig(true, false, false, false);
    }
}
