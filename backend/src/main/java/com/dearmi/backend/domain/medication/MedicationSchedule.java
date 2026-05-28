package com.dearmi.backend.domain.medication;

import com.dearmi.backend.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "medication_schedules")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class MedicationSchedule extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "prescription_id", columnDefinition = "uuid")
    private UUID prescriptionId;

    @Column(name = "prescription_medication_id", columnDefinition = "uuid")
    private UUID prescriptionMedicationId;

    @Column(name = "drug_name", length = 200, nullable = false)
    private String drugName;

    @Column(length = 100)
    private String dosage;

    @Column(name = "single_dose", length = 100)
    private String singleDose;

    @Column(name = "times_per_day")
    private Short timesPerDay;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    // 시간대별 복약 활성화 여부
    @Column(nullable = false)
    @Builder.Default
    private Boolean morning = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean afternoon = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean evening = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean bedtime = false;

    /** 약 종류 (항우울제, 수면진정제 등) — 사용자 입력 또는 허가정보 API 자동 채움 */
    @Column(name = "drug_category", length = 100)
    private String drugCategory;

    // 약품 상세 정보 (허가정보 API 캐시)
    @Column(name = "drug_effect", columnDefinition = "text")
    private String drugEffect;

    @Column(name = "drug_usage", columnDefinition = "text")
    private String drugUsage;

    @Column(name = "drug_caution", columnDefinition = "text")
    private String drugCaution;

    @Column(length = 200)
    private String manufacturer;

    /** 품목기준코드 — 약학정보원 상세 링크용 */
    @Column(name = "item_seq", length = 20)
    private String itemSeq;

    @Column(name = "drug_info_fetched_at")
    private java.time.LocalDateTime drugInfoFetchedAt;

    // 시간대별 복약 시각
    @Column(name = "morning_time")
    private LocalTime morningTime;

    @Column(name = "afternoon_time")
    private LocalTime afternoonTime;

    @Column(name = "evening_time")
    private LocalTime eveningTime;

    @Column(name = "bedtime_time")
    private LocalTime bedtimeTime;

    // 슬롯 그룹 연결 (nullable — 그룹 없으면 null)
    @Column(name = "morning_group_id", columnDefinition = "uuid")
    private UUID morningGroupId;

    @Column(name = "afternoon_group_id", columnDefinition = "uuid")
    private UUID afternoonGroupId;

    @Column(name = "evening_group_id", columnDefinition = "uuid")
    private UUID eveningGroupId;

    @Column(name = "bedtime_group_id", columnDefinition = "uuid")
    private UUID bedtimeGroupId;

    public void assignGroup(TimeSlot slot, UUID groupId) {
        switch (slot) {
            case MORNING   -> this.morningGroupId   = groupId;
            case AFTERNOON -> this.afternoonGroupId = groupId;
            case EVENING   -> this.eveningGroupId   = groupId;
            case BEDTIME   -> this.bedtimeGroupId   = groupId;
        }
    }

    public UUID getGroupId(TimeSlot slot) {
        return switch (slot) {
            case MORNING   -> morningGroupId;
            case AFTERNOON -> afternoonGroupId;
            case EVENING   -> eveningGroupId;
            case BEDTIME   -> bedtimeGroupId;
        };
    }

    public LocalTime getSlotTime(TimeSlot slot) {
        return switch (slot) {
            case MORNING   -> morningTime;
            case AFTERNOON -> afternoonTime;
            case EVENING   -> eveningTime;
            case BEDTIME   -> bedtimeTime;
        };
    }

    public void updateSlotTime(TimeSlot slot, LocalTime time) {
        switch (slot) {
            case MORNING   -> this.morningTime   = time;
            case AFTERNOON -> this.afternoonTime = time;
            case EVENING   -> this.eveningTime   = time;
            case BEDTIME   -> this.bedtimeTime   = time;
        }
    }

    public void updateDrugInfo(String drugEffect, String drugUsage, String drugCaution, String drugCategory, String manufacturer, String itemSeq) {
        this.drugEffect = drugEffect;
        this.drugUsage = drugUsage;
        this.drugCaution = drugCaution;
        this.drugCategory = drugCategory;
        this.itemSeq = itemSeq;
        this.manufacturer = manufacturer;
        this.drugInfoFetchedAt = java.time.LocalDateTime.now();
    }

    public void update(
            String drugName, String dosage, String singleDose, String drugCategory, Short timesPerDay,
            LocalDate startDate, LocalDate endDate,
            Boolean morning, Boolean afternoon, Boolean evening, Boolean bedtime,
            LocalTime morningTime, LocalTime afternoonTime, LocalTime eveningTime, LocalTime bedtimeTime
    ) {
        this.drugName = drugName;
        this.dosage = dosage;
        this.singleDose = singleDose;
        this.drugCategory = drugCategory;
        this.timesPerDay = timesPerDay;
        this.startDate = startDate;
        this.endDate = endDate;
        this.morning = morning != null && morning;
        this.afternoon = afternoon != null && afternoon;
        this.evening = evening != null && evening;
        this.bedtime = bedtime != null && bedtime;
        this.morningTime = morningTime;
        this.afternoonTime = afternoonTime;
        this.eveningTime = eveningTime;
        this.bedtimeTime = bedtimeTime;
    }
}
