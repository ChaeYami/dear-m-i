package com.dearmi.backend.domain.sideeffect;

import com.dearmi.backend.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 약 부작용 빠른 기록.
 * occurred_at 은 사용자가 증상을 느낀 시각 (필수).
 * medication_schedule_id 는 nullable — 어떤 약인지 모를 수도 있어야 함.
 */
@Entity
@Table(name = "side_effect_logs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class SideEffectLog extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "medication_schedule_id", columnDefinition = "uuid")
    private UUID medicationScheduleId;

    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;

    @Column(nullable = false, columnDefinition = "text")
    private String symptom;

    /** 1~5 (선택). null 이면 강도 미입력. */
    @Column
    private Short severity;

    @Column(columnDefinition = "text")
    private String notes;

    public void update(UUID medicationScheduleId, LocalDateTime occurredAt,
                       String symptom, Short severity, String notes) {
        this.medicationScheduleId = medicationScheduleId;
        this.occurredAt = occurredAt;
        this.symptom = symptom;
        this.severity = severity;
        this.notes = notes;
    }

    public void detachMedication() {
        this.medicationScheduleId = null;
    }
}
