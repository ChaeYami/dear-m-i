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

    // 시간대별 복약 시각
    @Column(name = "morning_time")
    private LocalTime morningTime;

    @Column(name = "afternoon_time")
    private LocalTime afternoonTime;

    @Column(name = "evening_time")
    private LocalTime eveningTime;

    @Column(name = "bedtime_time")
    private LocalTime bedtimeTime;

    public void update(String drugName, String dosage, Short timesPerDay, LocalDate startDate, LocalDate endDate) {
        this.drugName = drugName;
        this.dosage = dosage;
        this.timesPerDay = timesPerDay;
        this.startDate = startDate;
        this.endDate = endDate;
    }
}
