package com.dearmi.backend.domain.medication;

import com.dearmi.backend.common.entity.BaseTimestampEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "medication_logs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class MedicationLog extends BaseTimestampEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "medication_schedule_id", nullable = false, columnDefinition = "uuid")
    private UUID medicationScheduleId;

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "taken_at")
    private LocalDateTime takenAt;

    @Column(name = "log_date", nullable = false)
    @Builder.Default
    private LocalDate logDate = LocalDate.now();

    @Column(name = "time_slot", length = 20, nullable = false)
    @Builder.Default
    private String timeSlot = TimeSlot.MORNING.name();

    @Column(length = 20, nullable = false)
    @Builder.Default
    private String status = MedicationLogStatus.TAKEN.name();
}
