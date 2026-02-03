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

    // 약품 상세 정보 (e약은요 캐시)
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

    public void updateDrugInfo(String drugEffect, String drugUsage, String drugCaution, String manufacturer, String itemSeq) {
        this.drugEffect = drugEffect;
        this.drugUsage = drugUsage;
        this.drugCaution = drugCaution;
        this.itemSeq = itemSeq;
        this.manufacturer = manufacturer;
        this.drugInfoFetchedAt = java.time.LocalDateTime.now();
    }

    public void update(
            String drugName, String dosage, Short timesPerDay,
            LocalDate startDate, LocalDate endDate,
            Boolean morning, Boolean afternoon, Boolean evening, Boolean bedtime,
            LocalTime morningTime, LocalTime afternoonTime, LocalTime eveningTime, LocalTime bedtimeTime
    ) {
        this.drugName = drugName;
        this.dosage = dosage;
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
